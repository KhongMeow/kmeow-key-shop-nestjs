import { Controller, Post, Body, Param, Get, Delete } from '@nestjs/common';
import { RatingProductsService } from './rating-products.service';
import { CreateRatingProductDto } from './dto/create-rating-product.dto';
import { UpdateRatingProductDto } from './dto/update-rating-product.dto';

@Controller('rating-products')
export class RatingProductsController {
  constructor(private readonly ratingProductsService: RatingProductsService) {}

  @Post(':productId')
  create(@Param('productId') productId: number, @Body() createRatingProductDto: CreateRatingProductDto) {
    return this.ratingProductsService.create(productId, createRatingProductDto);
  }

  @Post(':productId')
  update(@Param('productId') productId: number, @Body() updateRatingProductDto: UpdateRatingProductDto) {
    return this.ratingProductsService.update(productId, updateRatingProductDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ratingProductsService.remove(+id);
  }
}