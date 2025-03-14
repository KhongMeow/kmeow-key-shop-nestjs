import { forwardRef, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateLicenseKeyDto } from './dto/create-license-key.dto';
import { UpdateLicenseKeyDto } from './dto/update-license-key.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { LicenseKey } from './entities/license-key.entity';
import { Repository } from 'typeorm';
import { ProductsService } from 'src/products/products.service';
import { OrdersService } from 'src/orders/orders.service';

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
      const product = await this.productsService.findOne(createLicenseKeyDto.productId);
      await this.isExistLicenseKey(createLicenseKeyDto.key);

      const licenseKey = new LicenseKey();
      licenseKey.key = createLicenseKeyDto.key;
      licenseKey.product = product;

      return await this.licenseKeysRepository.save(licenseKey);
    } catch (error) {
      throw new InternalServerErrorException(error.massage);
    }
  }

  async findAll(page?: number, limit?: number, order?: string, direction?: string): Promise<LicenseKey[]> {
    try {
      const skip = page && limit ? (page - 1) * limit : undefined;
      const take = limit ? limit : undefined;

      const licenseKeys = await this.licenseKeysRepository.find({
        relations: ['product'],
        skip,
        take,
        order: {
          [order || 'id']: direction || 'ASC',
        },
      });

      if (licenseKeys.length === 0) {
        throw new InternalServerErrorException('License keys is empty');
      }

      return licenseKeys;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findAllByProductId(productId: number, page?: number, limit?: number, order?: string, direction?: string, status?: string): Promise<LicenseKey[]> {
    try {
      const skip = page && limit ? (page - 1) * limit : undefined;
      const take = limit ? limit : undefined;

      const product = await this.productsService.findOne(productId);
      const licenseKeys = await this.licenseKeysRepository.find({
        where: { product },
        relations: ['product'],
        skip,
        take,
        order: {
          [order || 'id']: direction || 'ASC',
        },
      });

      if (licenseKeys.length === 0) {
        throw new InternalServerErrorException(`License keys for product ${product.name} is empty`);
      }

      return licenseKeys;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findAvailableLicenseKey(productId: number, limit: number): Promise<LicenseKey[]> {
    try {
      const product = await this.productsService.findOne(productId);
      const licenseKeys = await this.licenseKeysRepository.find({
        where: {
          product: { id: product.id },
          status: 'Active',
        },
        relations: ['product'],
        take: limit,
        order: {id: 'ASC'},
      });

      if (!licenseKeys.length) {
        throw new InternalServerErrorException(`License key for product ${product.name} is empty`);
      }

      return licenseKeys;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async makeOrderdLicenseKey(licenseKeyId: number, orderItemId: number) {
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

  async changeStatus(licenseKeyId: number, status: string): Promise<void> {
    try {
      const licenseKey = await this.findOne(licenseKeyId);
      licenseKey.status = status;

      await this.licenseKeysRepository.save(licenseKey);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async clearOrderdLicenseKey(licenseKeyId: number) {
    try {
      const licenseKey = await this.findOne(licenseKeyId);
      licenseKey.orderItem = null as any;
      licenseKey.status = 'Active';

      return await this.licenseKeysRepository.save(licenseKey);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findOne(id: number): Promise<LicenseKey> {
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

  async countByProductId(productId: number): Promise<number> {
    try {
      const product = await this.productsService.findOne(productId);
      const count = await this.licenseKeysRepository.countBy({ 
        product: { id: product.id },
        status: 'Active',
       });

      return count;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async update(id: number, updateLicenseKeyDto: UpdateLicenseKeyDto): Promise<LicenseKey> {
    try {
      if (!updateLicenseKeyDto.key && !updateLicenseKeyDto.productId) {
        throw new InternalServerErrorException('Key or product id must be provided');
      }

      if (updateLicenseKeyDto.key) {
        await this.isExistLicenseKey(updateLicenseKeyDto.key);
      }

      const licenseKey = await this.findOne(id);
      licenseKey.key = updateLicenseKeyDto.key ?? licenseKey.key;

      if (updateLicenseKeyDto.productId) {
        const product = await this.productsService.findOne(updateLicenseKeyDto.productId);
        licenseKey.product = product;
      }

      return await this.licenseKeysRepository.save(licenseKey);
    } catch (error) {
      throw new InternalServerErrorException(error.massage);
    }
  }

  async remove(id: number): Promise<{ status: number; message: string }> {
    try {
      const licenseKey = await this.findOne(id);
      await this.licenseKeysRepository.remove(licenseKey);

      return { 
        status: 200,
        message: `License key with id ${id} has been deleted`
      };
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
