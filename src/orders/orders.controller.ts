import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, UseInterceptors } from '@nestjs/common';
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
    const userId = user.sub;
    return this.ordersService.create(createOrderDto, userId);
  }

  @Post('confirm-payment')
  confirmPayment(@Body() orderId: number, @ActiveUser() user: ActiveUserData) {
    const userId = user.sub;
    return this.ordersService.confirmPayment(orderId, userId);
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
    const userId = user.sub;
    return this.ordersService.findAll(userId, page, limit, order, direction, status, period);
  }

  @Get()
  @Permissions('list-orders')
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'order', required: false })
  @ApiQuery({ name: 'direction', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['Order Created', 'Waiting Payment', 'Paid', 'Delivered', 'Failed to Deliver', 'Order Completed', 'Cancelled'] })
  @ApiQuery({ name: 'period', required: false, enum: ['thisWeek', 'thisMonth', 'thisYear', 'oneWeekBefore', 'oneMonthBefore', '3monthsBefore', '6monthsBefore', '1yearBefore'] })
  findAll(
    @Query('userId') userId?: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('order') order?: string,
    @Query('direction') direction?: string,
    @Query('status') status?: 'Order Created' | 'Waiting Payment' | 'Paid' | 'Delivered' | 'Failed to Deliver' | 'Order Completed' | 'Cancelled',
    @Query('period') period?: 'thisWeek' | 'thisMonth' | 'thisYear' | 'oneWeekBefore' | 'oneMonthBefore' | '3monthsBefore' | '6monthsBefore' | '1yearBefore',
  ) {
    return this.ordersService.findAll(userId, page, limit, order, direction, status, period);
  }

  @Get('my-order/:id')
  myOrder(
    @Param('id') id: string,
    @ActiveUser() user: ActiveUserData
  ) {
    const userId = user.sub;
    return this.ordersService.findOne(+id, userId);
  }

  @Get(':id')
  @Permissions('select-order')
  findOne(
    @Param('id') id: string,
    @Query('userId') userId?: number
  ) {
    return this.ordersService.findOne(+id, userId);
  }
}
