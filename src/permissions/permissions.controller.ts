import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, Query } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Permissions } from 'src/identity/authorization/decorators/permissions.decorator';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiBearerAuth('access-token')
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @Permissions('create-permission')
  @UseInterceptors(FileInterceptor(''))
  create(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionsService.create(createPermissionDto);
  }

  @Get()
  @Permissions('list-permissions')
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'order', required: false })
  @ApiQuery({ name: 'direction', required: false })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('order') order?: string,
    @Query('direction') direction?: string,
  ) {
    return this.permissionsService.findAll(page, limit, order, direction);
  }

  @Get(':slug')
  @Permissions('select-permission')
  findOne(@Param('slug') slug: string) {
    return this.permissionsService.findOne(slug);
  }

  @Patch(':slug')
  @Permissions('update-permission')
  @UseInterceptors(FileInterceptor(''))
  update(@Param('slug') slug: string, @Body() updatePermissionDto: UpdatePermissionDto) {
    return this.permissionsService.update(slug, updatePermissionDto);
  }

  @Delete(':slug')
  @Permissions('delete-permission')
  remove(@Param('slug') slug: string) {
    return this.permissionsService.remove(slug);
  }
}
