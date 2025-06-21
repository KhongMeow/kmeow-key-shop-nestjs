import { Controller, Post, Body, Param, Delete, Get } from '@nestjs/common';
import { RatingProductsService } from './rating-products.service';
import { CreateRatingProductDto } from './dto/create-rating-product.dto';
import { UpdateRatingProductDto } from './dto/update-rating-product.dto';
import { ActiveUser } from 'src/identity/decorators/active-user.decorator';
import { ActiveUserData } from 'src/identity/interfaces/active-user-data.interface';

@Controller('rating-products')
export class RatingProductsController {
  constructor(private readonly ratingProductsService: RatingProductsService) {}

  @Post(':productSlug')
  create(
    @Param('productSlug') productSlug: string,
    @Body() createRatingProductDto: CreateRatingProductDto,
    @ActiveUser() user: ActiveUserData,
  ) {
    const username = user.username;
    return this.ratingProductsService.create(productSlug, createRatingProductDto, username);
  }

  @Get()
  findAll() {
    return this.ratingProductsService.findAll();
  }

  @Get('product/:slug')
  findAllByProduct(@Param('slug') slug: string) {
    return this.ratingProductsService.findAllByProduct(slug);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ratingProductsService.findOne(+id);
  }

  @Post(':id')
  update(@Param('id') id: string, @Body() updateRatingProductDto: UpdateRatingProductDto) {
    return this.ratingProductsService.update(+id, updateRatingProductDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ratingProductsService.remove(+id);
  }
}