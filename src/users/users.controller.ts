import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, UseInterceptors } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { PermissionsGuard } from 'src/identity/authorization/guards/permissions/permissions.guard';
import { Permissions } from 'src/identity/authorization/decorators/permissions.decorator';
import { ChangeRoleDto } from './dto/change-role.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@UseGuards(PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Permissions('create-user')
  @UseInterceptors(FileInterceptor(''))
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Permissions('list-users')
  findAll(
      @Query('page') page?: number,
      @Query('limit') limit?: number,
      @Query('order') order?: string,
      @Query('direction') direction?: string,
    ) {
    return this.usersService.findAll(page, limit, order, direction);
  }

  @Get(':id')
  @Permissions('select-user')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Post('change-role/:id')
  @Permissions('change-role-user')
  @UseInterceptors(FileInterceptor(''))
  changeRole(@Param('id') id: string, @Body() changeRoleDto: ChangeRoleDto) {
    return this.usersService.changeRole(+id, changeRoleDto);
  }

  @Post('reset-password/:id')
  @Permissions('reset-password-user')
  resetPassword(@Param('id') id: string) {
    return this.usersService.resetPassword(+id);
  }

  @Delete(':id')
  @Permissions('delete-user')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
