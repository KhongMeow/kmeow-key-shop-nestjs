import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PermissionsGuard } from 'src/identity/authorization/guards/permissions/permissions.guard';
import { Permissions } from 'src/identity/authorization/decorators/permissions.decorator';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @UseGuards(PermissionsGuard)
  @Permissions('list-orders')
  findAll(
    @Query('userId') userId: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('order') order?: string,
    @Query('direction') direction?: string,
  ) {
    return this.ordersService.findAll(userId, page, limit, order, direction);
  }

  @Get(':id')
  @UseGuards(PermissionsGuard)
  @Permissions('select-order')
  findOne(
    @Param('id') id: string,
    @Query('userId') userId?: number) {
    return this.ordersService.findOne(+id, userId);
  }
}
