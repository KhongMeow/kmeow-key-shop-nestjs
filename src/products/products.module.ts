import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import jwtConfig from 'src/identity/config/jwt.config';
import { RolesModule } from 'src/roles/roles.module';
import { CategoriesModule } from 'src/categories/categories.module';
import { GlobalModule } from 'src/global/global.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product]),
    CategoriesModule,
    GlobalModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
