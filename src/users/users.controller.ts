import { Controller, Get, Post, Body, Param, Delete, Query, UseInterceptors, Patch } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Permissions } from 'src/identity/authorization/decorators/permissions.decorator';
import { ChangeRoleDto } from './dto/change-role.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ActiveUser } from 'src/identity/decorators/active-user.decorator';
import { ActiveUserData } from 'src/identity/interfaces/active-user-data.interface';
import { Auth } from 'src/identity/authentication/decorators/auth.decorator';
import { AuthType } from 'src/identity/authentication/enums/auth-type.enum';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@ApiBearerAuth('access-token')
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
    return this.usersService.findAll(page, limit, order, direction);
  }

  @Get('my-profile')
  myProfile(@ActiveUser() user: ActiveUserData) {
    const userId = user.sub;
    return this.usersService.myProfile(userId);
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

  @Post('change-password')
  @UseInterceptors(FileInterceptor(''))
  async changePassword(@ActiveUser() user: ActiveUserData, @Body() changePasswordDto: ChangePasswordDto) {
    const userId = user['sub'];
    return this.usersService.changePassword(userId, changePasswordDto);
  }

  @Delete(':id')
  @Permissions('delete-user')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }

  @Post('is-exist-username')
  @Auth(AuthType.None)
  @UseInterceptors(FileInterceptor(''))
  isExistUsername(@Body('username') username: string) {
    return this.usersService.isExistUsername(username);
  }

  @Post('is-exist-email')
  @Auth(AuthType.None)
  @UseInterceptors(FileInterceptor(''))
  isExistEmail(@Body('email') email: string) {
    return this.usersService.isExistEmail(email);
  }

  @Patch()
  @UseInterceptors(FileInterceptor(''))
  async update(@ActiveUser() user: ActiveUserData, @Body() updateUserDto: UpdateUserDto) {
    const userId = user['sub'];
    return this.usersService.update(userId, updateUserDto);
  }
}
