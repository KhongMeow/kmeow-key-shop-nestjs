import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors } from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Permissions } from 'src/identity/authorization/decorators/permissions.decorator';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiBearerAuth('access-token')
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @Permissions('create-role')
  @UseInterceptors(FileInterceptor(''))
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  @Permissions('list-roles')
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'order', required: false })
  @ApiQuery({ name: 'direction', required: false })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('order') order?: string,
    @Query('direction') direction?: string,
  ) {
    return this.rolesService.findAll(page, limit, order, direction);
  }

  @Get(':slug')
  @Permissions('select-role')
  findOne(@Param('slug') slug: string) {
    return this.rolesService.findOne(slug);
  }

  @Patch(':slug')
  @Permissions('update-role')
  @UseInterceptors(FileInterceptor(''))
  update(@Param('slug') slug: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.update(slug, updateRoleDto);
  }

  @Delete(':slug')
  @Permissions('delete-role')
  remove(@Param('slug') slug: string) {
    return this.rolesService.remove(slug);
  }
}
