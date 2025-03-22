import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, UseGuards } from '@nestjs/common';
import { RolePermissionsService } from './role-permissions.service';
import { CreateRolePermissionDto } from './dto/create-role-permission.dto';
import { UpdateRolePermissionDto } from './dto/update-role-permission.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Permissions } from 'src/identity/authorization/decorators/permissions.decorator';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiBearerAuth('access-token')
@Controller('role-permissions')
export class RolePermissionsController {
  constructor(private readonly rolePermissionsService: RolePermissionsService) {}

  @Post()
  @Permissions('create-role-permission')
  @UseInterceptors(FileInterceptor(''))
  create(@Body() createRolePermissionDto: CreateRolePermissionDto) {
    return this.rolePermissionsService.create(createRolePermissionDto);
  }

  @Get()
  @Permissions('list-role-permissions')
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
  return this.rolePermissionsService.findAll(page, limit, order, direction);
  }

  @Get(':id')
  @Permissions('select-role-permission')
  findOne(@Param('id') id: string) {
    return this.rolePermissionsService.findOne(+id);
  }

  @Patch(':id')
  @Permissions('update-role-permission')
  update(@Param('id') id: string, @Body() updateRolePermissionDto: UpdateRolePermissionDto) {
    return this.rolePermissionsService.update(+id, updateRolePermissionDto);
  }

  @Delete(':id')
  @Permissions('delete-role-permission')
  remove(@Param('id') id: string) {
    return this.rolePermissionsService.remove(+id);
  }
}
