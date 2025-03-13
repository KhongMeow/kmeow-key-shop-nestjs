import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateLicenseKeyDto } from './dto/create-license-key.dto';
import { UpdateLicenseKeyDto } from './dto/update-license-key.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { LicenseKey } from './entities/license-key.entity';
import { Repository } from 'typeorm';
import { ProductsService } from 'src/products/products.service';

@Injectable()
export class LicenseKeysService {
  constructor(
    @InjectRepository(LicenseKey) private readonly licenseKeyRepository: Repository<LicenseKey>,
    private readonly productsService: ProductsService,
  ) {}

  async create(createLicenseKeyDto: CreateLicenseKeyDto): Promise<LicenseKey> {
    try {
      const product = await this.productsService.findOne(createLicenseKeyDto.productId);
      await this.isExistLicenseKey(createLicenseKeyDto.key);

      const licenseKey = new LicenseKey();
      licenseKey.key = createLicenseKeyDto.key;
      licenseKey.product = product;

      return await this.licenseKeyRepository.save(licenseKey);
    } catch (error) {
      throw new InternalServerErrorException(error.massage);
    }
  }

  async findAll(page?: number, limit?: number, order?: string, direction?: string): Promise<LicenseKey[]> {
    try {
      const skip = page && limit ? (page - 1) * limit : undefined;
      const take = limit ? limit : undefined;

      const licenseKeys = await this.licenseKeyRepository.find({
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

  async findAllByProductId(productId: number, page?: number, limit?: number, order?: string, direction?: string): Promise<LicenseKey[]> {
    try {
      const skip = page && limit ? (page - 1) * limit : undefined;
      const take = limit ? limit : undefined;

      const product = await this.productsService.findOne(productId);
      const licenseKeys = await this.licenseKeyRepository.find({
        where: { product: product },
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

  async findOne(id: number): Promise<LicenseKey> {
    try {
      const licenseKey = await this.licenseKeyRepository.findOne({
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
      const count = await this.licenseKeyRepository.count({ 
        where: { product }
      });

      return count;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async update(id: number, updateLicenseKeyDto: UpdateLicenseKeyDto): Promise<LicenseKey> {
    try {
      if (updateLicenseKeyDto.key === undefined && updateLicenseKeyDto.productId === undefined) {
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

      return await this.licenseKeyRepository.save(licenseKey);
    } catch (error) {
      throw new InternalServerErrorException(error.massage);
    }
  }

  async remove(id: number): Promise<{ status: number; message: string }> {
    try {
      const licenseKey = await this.findOne(id);
      await this.licenseKeyRepository.remove(licenseKey);

      return { 
        status: 200,
        message: `License key with id ${id} has been deleted`
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async isExistLicenseKey(key: string): Promise<void> {
    const licenseKey = await this.licenseKeyRepository.findOneBy({ key });

    if (licenseKey) {
      throw new InternalServerErrorException(`License key ${key} is already exist`);
    }
  }
}
