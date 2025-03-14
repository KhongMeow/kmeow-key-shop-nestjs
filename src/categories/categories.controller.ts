import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { PermissionsGuard } from 'src/identity/authorization/guards/permissions/permissions.guard';
import { Permissions } from 'src/identity/authorization/decorators/permissions.decorator';
import { Auth } from 'src/identity/authentication/decorators/auth.decorator';
import { AuthType } from 'src/identity/authentication/enums/auth-type.enum';

@UseGuards(PermissionsGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @Permissions('create-category')
  @UseInterceptors(FileInterceptor(''))
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  @Auth(AuthType.None)
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('order') order?: string,
    @Query('direction') direction?: string,
  ) {
    return this.categoriesService.findAll(page, limit, order, direction);
  }

  @Get(':id')
  @Auth(AuthType.None)
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(+id);
  }

  @Patch(':id')
  @Permissions('update-category')
  @UseInterceptors(FileInterceptor(''))
  update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoriesService.update(+id, updateCategoryDto);
  }

  @Delete(':id')
  @Permissions('delete-category')
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(+id);
  }
}
