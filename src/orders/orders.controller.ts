import { Controller, Get, Post, Body, Param, Query, UseInterceptors } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { Permissions } from 'src/identity/authorization/decorators/permissions.decorator';
import { CreateOrderDto } from './dto/create-order.dto';
import { ActiveUser } from 'src/identity/decorators/active-user.decorator';
import { ActiveUserData } from 'src/identity/interfaces/active-user-data.interface';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiQuery } from '@nestjs/swagger';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseInterceptors(FileInterceptor(''))
  create(@Body() createOrderDto: CreateOrderDto, @ActiveUser() user: ActiveUserData) {
    const username = user.username;
    return this.ordersService.create(createOrderDto, username);
  }

  @Post('confirm-payment')
  confirmPayment(@Body() body:{ orderId: string }, @ActiveUser() user: ActiveUserData) {
    const orderId = body.orderId;
    const username = user.username;
    return this.ordersService.confirmPayment(orderId, username);
  }

  @Get('my-orders')
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'order', required: false })
  @ApiQuery({ name: 'direction', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['Order Created', 'Waiting Payment', 'Paid', 'Delivered', 'Failed to Deliver', 'Order Completed', 'Cancelled'] })
  @ApiQuery({ name: 'period', required: false, enum: ['thisWeek', 'thisMonth', 'thisYear', 'oneWeekBefore', 'oneMonthBefore', '3monthsBefore', '6monthsBefore', '1yearBefore'] })
  myOrders(
    @ActiveUser() user: ActiveUserData,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('order') order?: string,
    @Query('direction') direction?: string,
    @Query('status') status?: 'Order Created' | 'Waiting Payment' | 'Paid' | 'Delivered' | 'Failed to Deliver' | 'Order Completed' | 'Cancelled',
    @Query('period') period?: 'thisWeek' | 'thisMonth' | 'thisYear' | 'oneWeekBefore' | 'oneMonthBefore' | '3monthsBefore' | '6monthsBefore' | '1yearBefore',
  ) {
    const username = user.username;
    return this.ordersService.findAll(username, page, limit, order, direction, status, period);
  }

  @Get()
  @Permissions('list-orders')
  @ApiQuery({ name: 'username', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'order', required: false })
  @ApiQuery({ name: 'direction', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['Order Created', 'Waiting Payment', 'Paid', 'Delivered', 'Failed to Deliver', 'Order Completed', 'Cancelled'] })
  @ApiQuery({ name: 'period', required: false, enum: ['thisWeek', 'thisMonth', 'thisYear', 'oneWeekBefore', 'oneMonthBefore', '3monthsBefore', '6monthsBefore', '1yearBefore'] })
  findAll(
    @Query('username') username?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('order') order?: string,
    @Query('direction') direction?: string,
    @Query('status') status?: 'Order Created' | 'Waiting Payment' | 'Paid' | 'Delivered' | 'Failed to Deliver' | 'Order Completed' | 'Cancelled',
    @Query('period') period?: 'thisWeek' | 'thisMonth' | 'thisYear' | 'oneWeekBefore' | 'oneMonthBefore' | '3monthsBefore' | '6monthsBefore' | '1yearBefore',
  ) {
    return this.ordersService.findAll(username, page, limit, order, direction, status, period);
  }

  @Get('my-order/:id')
  myOrder(
    @Param('id') id: string,
    @ActiveUser() user: ActiveUserData
  ) {
    const username = user.username;
    return this.ordersService.findOne(id, username);
  }

  @Get(':id')
  @Permissions('select-order')
  findOne(
    @Param('id') id: string,
    @Query('username') username?: string
  ) {
    return this.ordersService.findOne(id, username);
  }
}
