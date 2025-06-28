import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoriesService } from 'src/categories/categories.service';
import { join } from 'path';
import { promises as fs } from 'fs';
import { GlobalService } from 'src/global/global.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private readonly productsRepository: Repository<Product>,
    private readonly categoriesService: CategoriesService,
    private readonly globalService: GlobalService,
  ) {}

  async create(createProductDto: CreateProductDto, image: Express.Multer.File): Promise<Product> {
    try {
      const category = await this.categoriesService.findOne(createProductDto.categorySlug);
      if (image) {
        await this.isExistProduct(createProductDto.name);
        
        const product = new Product();
        product.name = createProductDto.name;
        product.slug = await this.globalService.convertToSlug(createProductDto.name);
        product.price = createProductDto.price;
        product.detail = createProductDto.detail;
        product.description = createProductDto.description;
        product.category = category;

        const filePath = await this.uploadImage(image);
        product.image = filePath;

        return await this.productsRepository.save(product);
      } else {
        throw new BadRequestException('Image is required');
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findAll(categorySlug?: string, page?: number, limit?: number, order?: string, direction?: string, showSoldOut?: boolean): Promise<any[]> {
    try {
      const skip = page && limit ? (page - 1) * limit : undefined;
      const take = limit ? limit : undefined;

      const category = categorySlug ? await this.categoriesService.findOne(categorySlug) : undefined;

      const qb = this.productsRepository.createQueryBuilder('product')
        .leftJoinAndSelect('product.category', 'category')
        .leftJoin('product.licenseKeys', 'licenseKey', 'licenseKey.status = :status', { status: 'Active' })
        .addSelect('COUNT(licenseKey.id)', 'stock')
        .groupBy('product.id')
        .addGroupBy('category.id')
        .orderBy(`product.${order || 'id'}`, direction?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC');

      if (category) {
        qb.where('product.category = :categoryId', { categoryId: category.id });
      }

      if (!showSoldOut) {
        qb.having('COUNT(licenseKey.id) > 0');
      }
      
      if (skip !== undefined) qb.skip(skip);
      if (take !== undefined) qb.take(take);

      const { entities, raw } = await qb.getRawAndEntities();

      return entities.map((product, idx) => ({
        ...product,
        stock: parseInt(raw[idx].stock, 10),
      }));
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findOne(slug: string, categorySlug?: string | undefined): Promise<any> {
    try {
      const qb = this.productsRepository.createQueryBuilder('product')
        .leftJoinAndSelect('product.category', 'category')
        .leftJoinAndSelect('product.ratings', 'ratings')
        .leftJoin('product.licenseKeys', 'licenseKey', 'licenseKey.status = :status', { status: 'Active' })
        .addSelect('COUNT(licenseKey.id)', 'stock')
        .where('product.slug = :slug', { slug })
        .groupBy('product.id')
        .addGroupBy('category.id')
        .addGroupBy('ratings.id');

      // Add category filter if categorySlug is provided
      if (categorySlug) {
        qb.andWhere('category.slug = :categorySlug', { categorySlug });
      }

      const result = await qb.getRawAndEntities();

      const product = result.entities[0];
      if (!product) {
        throw new NotFoundException(`Product with slug ${slug} is not found`);
      }

      return {
        ...product,
        stock: parseInt(result.raw[0]?.stock ?? '0', 10),
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async update(slug: string, updateProductDto: UpdateProductDto, image: Express.Multer.File): Promise<Product> {
    try {
      const product = await this.findOne(slug);

      if (!updateProductDto.categorySlug && !updateProductDto.name && !updateProductDto.price && !updateProductDto.detail && !updateProductDto.description) {
        throw new BadRequestException('At least one field must be provided to update the product');
      }

      if (updateProductDto.categorySlug) {
        const category = await this.categoriesService.findOne(updateProductDto.categorySlug);
        product.category = category;
      }

      if (updateProductDto.name && updateProductDto.name !== product.name) {
        await this.isExistProduct(updateProductDto.name);
      }

      product.name = updateProductDto.name ?? product.name;
      product.slug = updateProductDto.name ? await this.globalService.convertToSlug(updateProductDto.name) : product.slug;
      product.price = updateProductDto.price ?? product.price;
      product.detail = updateProductDto.detail ?? product.detail;
      product.description = updateProductDto.description ?? product.description;
      product.price = updateProductDto.price ?? product.price;

      if (image) {
        const filePath = await this.uploadImage(image);
        product.image = filePath;
      }

      return await this.productsRepository.save(product);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async remove(slug: string): Promise<{ status: number, message: string }> {
    try {
      const product = await this.productsRepository.findOne({
        where: { slug },
        relations: ['licenseKeys'],
      });

      if (!product) {
        throw new NotFoundException(`Product with slug ${slug} is not found`);
      }

      if (product.licenseKeys.length > 0) {
        throw new BadRequestException(`This product was used by ${product.licenseKeys.length} license key(s)`);
      }

      await this.productsRepository.softDelete(product.id);

      return {
        status: 200,
        message: `This product has been deleted`
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  private async uploadImage(image: Express.Multer.File): Promise<string> {
    try {
      const maxSize = 5 * 1024 * 1024; // 5 MB
      if (image.size > maxSize) {
        throw new BadRequestException('Image size exceeds the maximum limit of 5 MB');
      }
  
      if (!image.mimetype.match(/\/(jpg|jpeg|png)$/)) {
        throw new BadRequestException('Only image files are allowed! e.g. jpg, jpeg, png');
      }
  
      const uploadDir = join(__dirname, '..', '..', 'images', 'products');
      const timestamp = Date.now();
      const filePath = join(uploadDir, `${timestamp}-${image.originalname}`);
  
      await fs.mkdir(uploadDir, { recursive: true });
      await fs.writeFile(filePath, image.buffer);
  
      return `/images/products/${timestamp}-${image.originalname}`;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async scaleRating(productSlug: string, scaleRating: number): Promise<void> {
    try {
      const product = await this.findOne(productSlug);
      product.scaleRating = scaleRating;

      await this.productsRepository.save(product);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async isExistProduct(name: string): Promise<void> {
    try {
      const product = await this.productsRepository.findOne({
        where: [
          { name },
          { slug: await this.globalService.convertToSlug(name) }
        ],
      });

      if (product) {
        throw new BadRequestException(`Product with name or slug ${name} is already exist`);
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
