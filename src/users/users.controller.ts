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
    const username = user.username;
    return this.usersService.myProfile(username);
  }

  @Get(':username')
  @Permissions('select-user')
  findOne(@Param('username') username: string) {
    return this.usersService.findOne(username);
  }

  @Post('change-role/:username')
  @Permissions('change-role-user')
  @UseInterceptors(FileInterceptor(''))
  changeRole(@Param('username') username: string, @Body() changeRoleDto: ChangeRoleDto) {
    return this.usersService.changeRole(username, changeRoleDto);
  }

  @Post('reset-password/:username')
  @Permissions('reset-password-user')
  resetPassword(@Param('username') username: string) {
    return this.usersService.resetPassword(username);
  }

  @Post('change-password')
  @UseInterceptors(FileInterceptor(''))
  async changePassword(@ActiveUser() user: ActiveUserData, @Body() changePasswordDto: ChangePasswordDto) {
    const username = user['username'];
    return this.usersService.changePassword(username, changePasswordDto);
  }

  @Delete(':username')
  @Permissions('delete-user')
  remove(@Param('username') username: string) {
    return this.usersService.remove(username);
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

  @Post('is-exist-email-auth')
  @UseInterceptors(FileInterceptor(''))
  isExistEmailAuth(@Body('email') email: string, @ActiveUser() user: ActiveUserData) {
    if (user.email !== email) {
      return this.usersService.isExistEmail(email);
    }
  }

  @Patch()
  @UseInterceptors(FileInterceptor(''))
  async update(@ActiveUser() user: ActiveUserData, @Body() updateUserDto: UpdateUserDto) {
    const username = user['username'];
    return this.usersService.update(username, updateUserDto);
  }
}
