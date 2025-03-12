import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, UseGuards } from '@nestjs/common';
import { RolePermissionsService } from './role-permissions.service';
import { CreateRolePermissionDto } from './dto/create-role-permission.dto';
import { UpdateRolePermissionDto } from './dto/update-role-permission.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { PermissionsGuard } from 'src/identity/authorization/guards/permissions/permissions.guard';
import { Permissions } from 'src/identity/authorization/decorators/permissions.decorator';

@UseGuards(PermissionsGuard)
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
  @Permissions('read-role-permission')
  findAll(
      @Query('page') page?: number,
      @Query('limit') limit?: number,
      @Query('order') order?: string,
      @Query('direction') direction?: string,
    ) {
    return this.rolePermissionsService.findAll(page, limit, order, direction);
  }

  @Get(':id')
  @Permissions('read-role-permission')
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
