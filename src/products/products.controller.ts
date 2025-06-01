import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, Query, BadRequestException, UploadedFile } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Permissions } from 'src/identity/authorization/decorators/permissions.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { Auth } from 'src/identity/authentication/decorators/auth.decorator';
import { AuthType } from 'src/identity/authentication/enums/auth-type.enum';
import { ApiQuery } from '@nestjs/swagger';
import { ImportProductsDto } from './dto/import-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Permissions('create-product')
  @UseInterceptors(FileInterceptor('image'))
  create(@Body() createProductDto: CreateProductDto, @UploadedFile() image: Express.Multer.File) {
    if (!image) {
      throw new BadRequestException('Image is required');
    }
    return this.productsService.create(createProductDto, image);
  }

  @Post('/import')
  @Permissions('create-product')
  @UseInterceptors(FileInterceptor('image'))
  import(@Body() importProductDto: ImportProductsDto, @UploadedFile() images: Express.Multer.File[]) {
    if (!images || images.length === 0) {
      throw new BadRequestException('Images are required');
    }
    return this.productsService.import(importProductDto, images);
  }

  @Get()
  @Auth(AuthType.None)
  @ApiQuery({ name: 'categorySlug', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'order', required: false })
  @ApiQuery({ name: 'direction', required: false })
  findAll(
    @Query('categorySlug') categorySlug?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('order') order?: string,
    @Query('direction') direction?: string,
  ) {
    return this.productsService.findAll(categorySlug, page, limit, order, direction);
  }

  @Get(':slug')
  @Auth(AuthType.None)
  findOne(@Param('slug') slug: string) {
    return this.productsService.findOne(slug);
  }

  @Patch(':slug')
  @Permissions('update-product')
  @UseInterceptors(FileInterceptor('image'))
  update(@Param('slug') slug: string, @Body() updateProductDto: UpdateProductDto, @UploadedFile() image: Express.Multer.File) {
    return this.productsService.update(slug, updateProductDto, image);
  }

  @Delete(':slug')
  @Permissions('delete-product')
  remove(@Param('slug') slug: string) {
    return this.productsService.remove(slug);
  }
}
