import { Controller, Get, Post, Body, Param, Delete, Query } from '@nestjs/common';
import { BalancesService } from './balances.service';
import { Permissions } from 'src/identity/authorization/decorators/permissions.decorator';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ActiveUser } from 'src/identity/decorators/active-user.decorator';
import { ActiveUserData } from 'src/identity/interfaces/active-user-data.interface';

@ApiBearerAuth('access-token')
@Controller('balances')
export class BalancesController {
  constructor(private readonly balancesService: BalancesService) {}

  @Get()
  @Permissions('list-balances')
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
    return this.balancesService.findAll(page, limit, order, direction);
  }

  @Get('my-balance')
  myBalance(@ActiveUser() user: ActiveUserData) {
    const username = user.username;
    return this.balancesService.myBalance(username);
  }

  @Get(':slug')
  @Permissions('select-balance')
  findOne(
    @Param('slug') slug: string,
  ) {
    return this.balancesService.findOne(slug);
  }

  @Delete(':slug')
  @Permissions('delete-balance')
  remove(@Param('slug') slug: string) {
    return this.balancesService.remove(slug);
  }

  @Post('increase-my-amount')
  increaseMyAmount(@ActiveUser() user: ActiveUserData, @Body('amount') amount: number) {
    return this.balancesService.increaseMyAmount(user.username, amount);
  }

  @Post('increase-amount')
  @Permissions('increase-amount')
  increaseAmount(@Body() balanceSlug: string, amount: number) {
    return this.balancesService.increaseAmount(balanceSlug, amount);
  }

  @Post('decrease-amount')
  @Permissions('decrease-amount')
  decreaseAmount(@Body() balanceSlug: string, amount: number) {
    return this.balancesService.decreaseAmount(balanceSlug, amount);
  }
}
