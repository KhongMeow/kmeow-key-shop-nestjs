import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoriesService } from 'src/categories/categories.service';
import { join } from 'path';
import { promises as fs } from 'fs';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private readonly productsRepository: Repository<Product>,
    private readonly categoriesService: CategoriesService,
  ) {}

  async create(createProductDto: CreateProductDto, image: Express.Multer.File): Promise<Product> {
    try {
      const category = await this.categoriesService.findOne(createProductDto.categoryId);

      const product = new Product();
      product.name = createProductDto.name;
      product.price = createProductDto.price;
      product.detail = createProductDto.detail;
      product.description = createProductDto.description;
      product.category = category;

      if (image) {
        const filePath = await this.uploadImage(image);
        product.image = filePath;
      }

      return await this.productsRepository.save(product);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findAll(page?: number, limit?: number, order?: string, direction?: string): Promise<Product[]> {
    try {
      const skip = page && limit ? (page - 1) * limit : undefined;
      const take = limit ? limit : undefined;

      const products = await this.productsRepository.find({
        relations: ['category'],
        skip,
        take,
        order: {
          [order || 'id']: direction || 'ASC',
        },
      });

      if (products.length === 0) {
        throw new NotFoundException('Products is empty');
      }

      return products;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findOne(id: number): Promise<Product> {
    try {
      const product = await this.productsRepository.findOne({
        where: { id },
        relations: ['category'],
      });

      if (!product) {
        throw new NotFoundException(`Product with id ${id} is not found`);
      }

      return product;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async update(id: number, updateProductDto: UpdateProductDto, image: Express.Multer.File): Promise<Product> {
    try {
      const product = await this.findOne(id);

      if (updateProductDto.categoryId) {
        const category = await this.categoriesService.findOne(updateProductDto.categoryId);
        product.category = category;
      }
      
      product.name = updateProductDto.name ?? product.name;
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

  async remove(id: number): Promise<{ status: number, message: string }> {
    try {
      const product = await this.findOne(id);
      await this.productsRepository.softDelete(id);

      return {
        status: 200,
        message: `Product with id ${id} has been deleted`
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
  
      return filePath;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
