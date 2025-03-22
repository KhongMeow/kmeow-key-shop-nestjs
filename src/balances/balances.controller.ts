import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { BalancesService } from './balances.service';
import { Permissions } from 'src/identity/authorization/decorators/permissions.decorator';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

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

  @Get(':id')
  @Permissions('select-balance')
  findOne(
    @Param('id') id: string,
    @Query('userId') userId?: number) 
  {
    return this.balancesService.findOne(+id);
  }

  @Delete(':id')
  @Permissions('delete-balance')
  remove(@Param('id') id: string) {
    return this.balancesService.remove(+id);
  }
}
