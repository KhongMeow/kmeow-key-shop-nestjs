import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRatingProductDto } from './dto/create-rating-product.dto';
import { UpdateRatingProductDto } from './dto/update-rating-product.dto';
import { RatingProduct } from './entities/rating-product.entity';
import { ProductsService } from 'src/products/products.service';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class RatingProductsService {
  constructor(
    @InjectRepository(RatingProduct)
    private ratingProductRepository: Repository<RatingProduct>,
    private readonly productsService: ProductsService,
    private readonly usersService: UsersService,
  ) {}

  async create(productSlug: string, createRatingProductDto: CreateRatingProductDto, username: string): Promise<RatingProduct> {
    try {
      const product = await this.productsService.findOne(productSlug);
      const user = await this.usersService.findOne(username);
    
      const ratingProduct = new RatingProduct();
      ratingProduct.rating = createRatingProductDto.rating;
      ratingProduct.comment = createRatingProductDto.comment;
      ratingProduct.user = user;
      ratingProduct.product = product;
      
      const savedRating = await this.ratingProductRepository.save(ratingProduct);

      const scaleRating = await this.getAverageRating(product.slug);
      await this.productsService.scaleRating(product.slug, scaleRating);
      
      // Return fresh data with updated product rating
      return await this.findOne(savedRating.id);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findAll(): Promise<RatingProduct[]> {
    try {
      const ratings = await this.ratingProductRepository.find({
        relations: ['user', 'product'],
      });

      if (ratings.length === 0) {
        throw new NotFoundException('Ratings is empty');
      }

      return ratings;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findAllByProduct(slug: string): Promise<RatingProduct[]> {
    try {
      const product = await this.productsService.findOne(slug);
      const ratings = await this.ratingProductRepository.find({
        where: { product: { id: product.id } },
        relations: ['user', 'product'],
      });

      if (ratings.length === 0) {
        throw new NotFoundException(`Ratings for product with slug ${slug} is empty`);
      }

      return ratings;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findOne(id: number): Promise<RatingProduct> {
    try {
      const rating = await this.ratingProductRepository.findOne({
        where: { id },
        relations: ['user', 'product'],
      });

      if (!rating) {
        throw new InternalServerErrorException(`Rating with id ${id} is not found`);
      }

      return rating;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
  
  async findOneByUser(id: number, username: string): Promise<RatingProduct> {
    try {
      const rating = await this.ratingProductRepository.findOne({
        where: { id, user: { username } },
        relations: ['user', 'product'],
      });

      if (!rating) {
        throw new InternalServerErrorException(`Rating with id ${id} is not found`);
      }

      return rating;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  private async getAverageRating(productSlug: string): Promise<number> {
    const product = await this.productsService.findOne(productSlug);

    const ratings = await this.ratingProductRepository.find({
      where: { product: { id: product.id } },
    });
    const totalRatings = ratings.length;
    if (totalRatings === 0) return 0;
    const sumRatings = ratings.reduce((sum, rating) => sum + rating.rating, 0);

    return sumRatings / totalRatings;
  }

  async update(id: number, updateRatingProductDto: UpdateRatingProductDto, username: string): Promise<RatingProduct> {
    try {
      const ratingProduct = await this.findOneByUser(id, username);

      if (updateRatingProductDto.rating !== undefined) {
        ratingProduct.rating = updateRatingProductDto.rating;
      }
      if (updateRatingProductDto.comment !== undefined){
        ratingProduct.comment = updateRatingProductDto.comment;
      }

      await this.ratingProductRepository.save(ratingProduct);

      const scaleRating = await this.getAverageRating(ratingProduct.product.slug);
      await this.productsService.scaleRating(ratingProduct.product.slug, scaleRating);
      return ratingProduct;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async remove(id: number): Promise<{ status: number, message: string }> {
    try {
      const ratingProduct = await this.findOne(id);
      await this.ratingProductRepository.softDelete(ratingProduct.id);

      const scaleRating = await this.getAverageRating(ratingProduct.product.slug);
      await this.productsService.scaleRating(ratingProduct.product.slug, scaleRating);
      
      return {
        status: 200,
        message: `This rating has been deleted`
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}