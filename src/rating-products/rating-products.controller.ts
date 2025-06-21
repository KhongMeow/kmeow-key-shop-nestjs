import { Controller, Post, Body, Param, Delete, Get, Patch } from '@nestjs/common';
import { RatingProductsService } from './rating-products.service';
import { CreateRatingProductDto } from './dto/create-rating-product.dto';
import { UpdateRatingProductDto } from './dto/update-rating-product.dto';
import { ActiveUser } from 'src/identity/decorators/active-user.decorator';
import { ActiveUserData } from 'src/identity/interfaces/active-user-data.interface';
import { Auth } from 'src/identity/authentication/decorators/auth.decorator';
import { AuthType } from 'src/identity/authentication/enums/auth-type.enum';

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
  @Auth(AuthType.None)
  findAll() {
    return this.ratingProductsService.findAll();
  }

  @Get('product/:slug')
  @Auth(AuthType.None)
  findAllByProduct(@Param('slug') slug: string) {
    return this.ratingProductsService.findAllByProduct(slug);
  }

  @Get(':id')
  @Auth(AuthType.None)
  findOne(@Param('id') id: string, @ActiveUser() user: ActiveUserData) {
    const username = user.username;
    return this.ratingProductsService.findOneByUser(+id, username);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateRatingProductDto: UpdateRatingProductDto,
    @ActiveUser() user: ActiveUserData
  ) {
    const username = user.username;
    return this.ratingProductsService.update(+id, updateRatingProductDto, username);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ratingProductsService.remove(+id);
  }
}