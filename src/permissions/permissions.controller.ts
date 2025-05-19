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

  @Get(':id')
  @Permissions('select-permission')
  findOne(@Param('id') id: string) {
    return this.permissionsService.findOne(+id);
  }

  @Patch(':id')
  @Permissions('update-permission')
  @UseInterceptors(FileInterceptor(''))
  update(@Param('id') id: string, @Body() updatePermissionDto: UpdatePermissionDto) {
    return this.permissionsService.update(+id, updatePermissionDto);
  }

  @Delete(':id')
  @Permissions('delete-permission')
  remove(@Param('id') id: string) {
    return this.permissionsService.remove(+id);
  }
}
