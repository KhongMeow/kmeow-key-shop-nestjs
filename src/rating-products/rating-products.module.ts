import { Module } from '@nestjs/common';
import { RatingProductsService } from './rating-products.service';
import { RatingProductsController } from './rating-products.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RatingProduct } from './entities/rating-product.entity';
import { UsersModule } from 'src/users/users.module';
import { ProductsModule } from 'src/products/products.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RatingProduct]),
    UsersModule,
    ProductsModule,
  ],
  controllers: [RatingProductsController],
  providers: [RatingProductsService],
})
export class RatingProductsModule {}
