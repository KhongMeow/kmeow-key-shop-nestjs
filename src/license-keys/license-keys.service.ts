import { forwardRef, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateLicenseKeyDto } from './dto/create-license-key.dto';
import { UpdateLicenseKeyDto } from './dto/update-license-key.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { LicenseKey } from './entities/license-key.entity';
import { Repository } from 'typeorm';
import { ProductsService } from 'src/products/products.service';
import { OrdersService } from 'src/orders/orders.service';
import { ImportLicenseKeysDto } from './dto/import-license-key.dto';

@Injectable()
export class LicenseKeysService {
  constructor(
    @InjectRepository(LicenseKey) private readonly licenseKeysRepository: Repository<LicenseKey>,
    private readonly productsService: ProductsService,
    @Inject(forwardRef(() => OrdersService))
    private readonly ordersService: OrdersService,
  ) {}

  async create(createLicenseKeyDto: CreateLicenseKeyDto): Promise<LicenseKey> {
    try {
      const product = await this.productsService.findOne(createLicenseKeyDto.productSlug);
      await this.isExistLicenseKey(createLicenseKeyDto.key);

      const licenseKey = new LicenseKey();
      licenseKey.key = createLicenseKeyDto.key;
      licenseKey.product = product;

      return await this.licenseKeysRepository.save(licenseKey);
    } catch (error) {
      throw new InternalServerErrorException(error.massage);
    }
  }

  async import(importLicenseKeyDto: ImportLicenseKeysDto): Promise<LicenseKey[]> {
    try {
      if (
        !importLicenseKeyDto.key?.length ||
        !importLicenseKeyDto.productSlug?.length ||
        importLicenseKeyDto.key.length !== importLicenseKeyDto.productSlug.length
      ) {
        throw new InternalServerErrorException('Invalid license keys data');
      }

      const licenseKeys: LicenseKey[] = [];
      const duplicates: string[] = [];

      for (let i = 0; i < importLicenseKeyDto.key.length; i++) {
        const key = importLicenseKeyDto.key[i];
        const productSlug = importLicenseKeyDto.productSlug[i];

        const exist = await this.licenseKeysRepository.findOneBy({ key });
        if (exist) {
          duplicates.push(key);
          continue;
        }

        const product = await this.productsService.findOne(productSlug);
        const licenseKey = new LicenseKey();
        licenseKey.key = key;
        licenseKey.product = product;
        licenseKeys.push(licenseKey);
      }

      if (licenseKeys.length) {
        await this.licenseKeysRepository.save(licenseKeys);
      }

      if (duplicates.length) {
        throw new InternalServerErrorException(`Some license keys are duplicates: ${duplicates.join(', ')}`);
      }

      return licenseKeys;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async getLicenseKeyStats(
    groupBy: 'daily' | 'weekly' | 'monthly' | 'yearly'
  ): Promise<{ date: string; total: number; totalPrice: number; status: string }[]> {
    try {
      let dateFormat: string;
      switch (groupBy) {
        case 'weekly':
          dateFormat = "TO_CHAR(licenseKey.updatedAt, 'IYYY-IW')"; // ISO week
          break;
        case 'monthly':
          dateFormat = "TO_CHAR(licenseKey.updatedAt, 'YYYY-MM')";
          break;
        case 'yearly':
          dateFormat = "TO_CHAR(licenseKey.updatedAt, 'YYYY')";
          break;
        case 'daily':
          dateFormat = "TO_CHAR(licenseKey.updatedAt, 'YYYY-MM-DD')";
          break;
      }

      const qb = this.licenseKeysRepository.createQueryBuilder('licenseKey')
        .leftJoin('licenseKey.product', 'product')
        .select(`${dateFormat}`, 'date')
        .addSelect('COUNT(licenseKey.id)', 'total')
        .addSelect('SUM(product.price)', 'totalPrice')
        .addSelect('licenseKey.status', 'status')
        .where('licenseKey.status = :status', { status: 'Sold' })
        .groupBy(`${dateFormat}`)
        .addGroupBy('licenseKey.status');

      qb.orderBy('date', 'ASC');

      const result = await qb.getRawMany();
      return result.map(row => ({
        date: row.date,
        total: Number(row.total),
        totalPrice: Number(row.totalPrice) || 0,
        status: row.status,
      }));
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findAll(productSlug?: string, page?: number, limit?: number, order?: string, direction?: string): Promise<LicenseKey[]> {
    try {
      const skip = page && limit ? (page - 1) * limit : undefined;
      const take = limit ? limit : undefined;

      const product = productSlug ? await this.productsService.findOne(productSlug) : undefined;

      const licenseKeys = await this.licenseKeysRepository.find({
        relations: ['product'],
        where: product ? { product: { id: product.id } } : {},
        skip,
        take,
        order: {
          status: 'ASC',
          [order || 'id']: direction || 'ASC',
        },
      });

      if (licenseKeys.length === 0) {
        if (product) {
          throw new InternalServerErrorException(`License keys for product ${product.name} is empty`);
        }
        throw new InternalServerErrorException('License keys is empty');
      }

      return licenseKeys;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findAvailableLicenseKey(productSlug: string, limit: number): Promise<LicenseKey[]> {
    try {
      const product = await this.productsService.findOne(productSlug);
      const licenseKeys = await this.licenseKeysRepository.find({
        where: {
          product: { id: product.id },
          status: 'Active',
        },
        relations: ['product'],
        take: limit,
        order: { id: 'ASC' },
      });

      if (!licenseKeys.length) {
        throw new InternalServerErrorException(`License key for product ${product.name} is empty`);
      }

      return licenseKeys;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async makeOrderdLicenseKey(licenseKeyId: string, orderItemId: string) {
    try {
      const orderItem = await this.ordersService.findOneOrderItem(orderItemId);
      const licenseKey = await this.findOne(licenseKeyId);
      
      licenseKey.orderItem = orderItem;
      licenseKey.status = 'Ordered';

      return await this.licenseKeysRepository.save(licenseKey);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async changeStatus(licenseKeyId: string, status: string): Promise<void> {
    try {
      const licenseKey = await this.findOne(licenseKeyId);
      licenseKey.status = status;

      await this.licenseKeysRepository.save(licenseKey);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async clearOrderdLicenseKey(licenseKeyId: string) {
    try {
      const licenseKey = await this.findOne(licenseKeyId);
      licenseKey.orderItem = null as any;
      licenseKey.status = 'Active';

      return await this.licenseKeysRepository.save(licenseKey);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findOne(id: string): Promise<LicenseKey> {
    try {
      const licenseKey = await this.licenseKeysRepository.findOne({
        where: { id },
        relations: ['product'],
      });

      if (!licenseKey) {
        throw new InternalServerErrorException(`License key ${id} is not exist`);
      }

      return licenseKey;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async countByProductSlug(productSlug: string): Promise<number> {
    try {
      const product = await this.productsService.findOne(productSlug);
      const count = await this.licenseKeysRepository.countBy({ 
        product: { id: product.id },
        status: 'Active',
       });

      return count;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async update(id: string, updateLicenseKeyDto: UpdateLicenseKeyDto): Promise<LicenseKey> {
    try {
      if (!updateLicenseKeyDto.key && !updateLicenseKeyDto.productSlug) {
        throw new InternalServerErrorException('Key or product id must be provided');
      }

      if (updateLicenseKeyDto.key) {
        await this.isExistLicenseKey(updateLicenseKeyDto.key);
      }

      const licenseKey = await this.findOne(id);
      licenseKey.key = updateLicenseKeyDto.key ?? licenseKey.key;

      if (updateLicenseKeyDto.productSlug) {
        const product = await this.productsService.findOne(updateLicenseKeyDto.productSlug);
        licenseKey.product = product;
      }

      return await this.licenseKeysRepository.save(licenseKey);
    } catch (error) {
      throw new InternalServerErrorException(error.massage);
    }
  }

  async remove(id: string): Promise<{ status: number; message: string }> {
    try {
      const licenseKey = await this.findOne(id);

      if (licenseKey.status === 'Active') {
        await this.licenseKeysRepository.softDelete(licenseKey.id);

        return { 
          status: 200,
          message: `License key with id ${id} has been deleted`
        };
      }

      throw new InternalServerErrorException(`License key can not be deleted because it is not active`);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async isExistLicenseKey(key: string): Promise<void> {
    const licenseKey = await this.licenseKeysRepository.findOneBy({ key });

    if (licenseKey) {
      throw new InternalServerErrorException(`License key ${key} is already exist`);
    }
  }
}
