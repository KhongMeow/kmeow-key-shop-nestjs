import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, Query, BadRequestException, UploadedFile } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PermissionsGuard } from 'src/identity/authorization/guards/permissions/permissions.guard';
import { Permissions } from 'src/identity/authorization/decorators/permissions.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { Auth } from 'src/identity/authentication/decorators/auth.decorator';
import { AuthType } from 'src/identity/authentication/enums/auth-type.enum';

@UseGuards(PermissionsGuard)
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

  @Get()
  @Auth(AuthType.None)
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('order') order?: string,
    @Query('direction') direction?: string,
  ) {
    return this.productsService.findAll(page, limit, order, direction);
  }

  @Get('category/:categoryId')
  @Auth(AuthType.None)
  findAllByCategoryId(
    @Param('categoryId') categoryId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('order') order?: string,
    @Query('direction') direction?: string,
  ) {
    return this.productsService.findAllByCategoryId(+categoryId, page, limit, order, direction);
  }

  @Get(':id')
  @Auth(AuthType.None)
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(+id);
  }

  @Patch(':id')
  @Permissions('update-product')
  @UseInterceptors(FileInterceptor('image'))
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto, image: Express.Multer.File) {
    return this.productsService.update(+id, updateProductDto, image);
  }

  @Delete(':id')
  @Permissions('delete-product')
  remove(@Param('id') id: string) {
    return this.productsService.remove(+id);
  }
}
