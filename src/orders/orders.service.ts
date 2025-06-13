import { forwardRef, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { LessThan, MoreThan, Repository } from 'typeorm';
import { UsersService } from 'src/users/users.service';
import { ProductsService } from 'src/products/products.service';
import { OrderItem } from './entities/order-item.entity';
import { LicenseKeysService } from 'src/license-keys/license-keys.service';
import { BalancesService } from 'src/balances/balances.service';
import { MailService } from 'src/mails/mail.service';
import Redis from 'ioredis';
import { Between } from 'typeorm';
import * as moment from 'moment';
import { SchedulerRegistry } from '@nestjs/schedule';

@Injectable()
export class OrdersService {
  private redisClient: Redis;

  constructor(
    @InjectRepository(Order) private ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem) private orderItemsRepository: Repository<OrderItem>,
    private readonly usersService: UsersService,
    private readonly productsService: ProductsService,
    @Inject(forwardRef(() => LicenseKeysService))
    private readonly licenseKeysService: LicenseKeysService,
    private readonly balancesService: BalancesService,
    private readonly mailService: MailService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  private scheduleOrderTimeout(orderId: string, delay: number) {
    const timeout = setTimeout(async () => {
      try {
        await this.waitingPayment(orderId);
        this.schedulerRegistry.deleteTimeout(`order-timeout-${orderId}`);
      } catch (error) {
        console.error(`Error in order timeout for ${orderId}:`, error);
      }
    }, delay);

    this.schedulerRegistry.addTimeout(`order-timeout-${orderId}`, timeout);
    console.log(`Timeout scheduled for order ${orderId}`);
  }

  // Check and reschedule timeouts on service startup
  async onModuleInit() {
    console.log('🚀 Orders service starting up...');
    
    const pendingOrders = await this.ordersRepository.find({
      where: {
        status: 'Waiting Payment',
        paymentDeadline: LessThan(new Date())
      }
    });

    console.log(`Found ${pendingOrders.length} expired orders to cancel`);
    
    // Cancel already expired orders
    for (const order of pendingOrders) {
      await this.waitingPayment(order.id);
    }

    // Reschedule timeouts for non-expired orders
    const activeOrders = await this.ordersRepository.find({
      where: {
        status: 'Waiting Payment',
        paymentDeadline: MoreThan(new Date())
      }
    });

    console.log(`Found ${activeOrders.length} active orders to reschedule`);

    for (const order of activeOrders) {
      const remainingTime = order.paymentDeadline.getTime() - Date.now();
      if (remainingTime > 0) {
        this.scheduleOrderTimeout(order.id, remainingTime);
      }
    }
  }

  async create(createOrderDto: CreateOrderDto, username: string): Promise<Order> {
    try {
      const user = await this.usersService.findOne(username);

      const order = new Order();
      order.email = createOrderDto.email;
      order.user = user;
      order.status = 'Order Created';

      await this.ordersRepository.save(order);

      let totalOrderedPrice = 0;
      for (const item of createOrderDto.orderItems) {
        const product = await this.productsService.findOne(item.productSlug);

        const orderItem = new OrderItem();
        orderItem.order = order;
        orderItem.product = product;
        orderItem.quantity = item.quantity;

        await this.orderItemsRepository.save(orderItem);

        const licenseKeys = await this.licenseKeysService.findAvailableLicenseKey(product.slug, item.quantity);
        for (const licenseKey of licenseKeys) {
          await this.licenseKeysService.makeOrderdLicenseKey(licenseKey.id, orderItem.id);
        }
        
        orderItem.quantity = licenseKeys.length;

        await this.orderItemsRepository.save(orderItem);
        totalOrderedPrice += product.price * orderItem.quantity;
      }

      order.status = 'Waiting Payment';

      // Store payment deadline in database instead of setTimeout
      order.paymentDeadline = new Date(Date.now() + 5 * 60 * 1000);
      await this.ordersRepository.save(order);

      // Schedule the timeout
      this.scheduleOrderTimeout(order.id, 5 * 60 * 1000);

      return order;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
  
  async waitingPayment(orderId: string): Promise<void> {
    try {
      const order = await this.findOne(orderId);
      if (order.status === 'Waiting Payment') {
        order.status = 'Cancelled';
        order.cancelledAt = new Date();
        await this.ordersRepository.save(order);

        for (const item of order.orderItems) {
          for (const licenseKey of item.licenseKeys) {
            await this.licenseKeysService.clearOrderdLicenseKey(licenseKey.id);
          }
        }
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async confirmPayment(orderId: string, username: string) {
    try {
      const order = await this.findOne(orderId);
      const user = await this.usersService.findOne(username);
      
      if (order.user.id !== user.id) {
        throw new InternalServerErrorException(`This user does not have order with id ${orderId}`);
      }

      if (order.status !== 'Waiting Payment') {
        throw new InternalServerErrorException(`Order with id ${orderId} is not waiting payment`);
      }

      let totalOrderedPrice = 0;
      for (const item of order.orderItems) {
        for (const licenseKey of item.licenseKeys) {
          await this.licenseKeysService.changeStatus(licenseKey.id, 'Sold');
          totalOrderedPrice += licenseKey.product.price
        }
      }

      // Decrease user balance
      await this.balancesService.decreaseAmount(user.balance.slug, totalOrderedPrice);
      order.paidAt = new Date();
      order.status = 'Paid';
      await this.ordersRepository.save(order);
      await this.redisClient.del(`waitingPayment:${orderId}`);
      
      // Cancel the scheduled timeout when payment is confirmed
      try {
        this.schedulerRegistry.deleteTimeout(`order-timeout-${orderId}`);
        console.log(`Timeout cancelled for order ${orderId}`);
      } catch (error) {
        // Timeout might not exist, ignore
        console.log(`No timeout found for order ${orderId}`);
      }

      try {
        // Start Delivering
        await this.mailService.sendMail(
          order.email,
          `Your License Key(s) from K'meow Key Shop`,
          `Your order with id ${orderId} has been confirmed. Here is your license key(s): 
          ${order.orderItems.map(item => item.licenseKeys.map(licenseKey => licenseKey.key).join(', ')).join(', ')}`
        );
        order.deliveredAt = new Date();
        order.status = 'Delivered';
        await this.ordersRepository.save(order);
      } catch (error) {
        order.status = 'Failed to Deliver';
        await this.ordersRepository.save(order);
        throw new InternalServerErrorException('Failed to send confirmation email');
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findAll(
    username?: string,
    page?: number,
    limit?: number,
    order?: string,
    direction?: string,
    status?: 'Order Created' | 'Waiting Payment' | 'Paid' | 'Delivered' | 'Failed to Deliver' | 'Order Completed' | 'Cancelled',
    period?: 'thisWeek' | 'thisMonth' | 'thisYear' | 'oneWeekBefore' | 'oneMonthBefore' | '3monthsBefore' | '6monthsBefore' | '1yearBefore'
  ): Promise<Order[]> {
    try {
      const skip = page && limit ? (page - 1) * limit : undefined;
      const take = limit ? limit : undefined;
  
      const user = username ? await this.usersService.findOne(username) : undefined;
  
      let where: any = user ? { user: { id: user?.id } } : {};
  
      if (period) {
        let startDate: Date;
        let endDate: Date = new Date();
  
        switch (period) {
          case 'thisWeek':
            startDate = moment().startOf('week').toDate();
            endDate = moment().endOf('week').toDate();
            break;
          case 'thisMonth':
            startDate = moment().startOf('month').toDate();
            endDate = moment().endOf('month').toDate();
            break;
          case 'thisYear':
            startDate = moment().startOf('year').toDate();
            endDate = moment().endOf('year').toDate();
            break;
          case 'oneWeekBefore':
            startDate = moment().subtract(1, 'weeks').startOf('week').toDate();
            endDate = moment().subtract(1, 'weeks').endOf('week').toDate();
            break;
          case 'oneMonthBefore':
            startDate = moment().subtract(1, 'months').startOf('month').toDate();
            endDate = moment().subtract(1, 'months').endOf('month').toDate();
            break;
          case '3monthsBefore':
            startDate = moment().subtract(3, 'months').startOf('month').toDate();
            endDate = moment().subtract(3, 'months').endOf('month').toDate();
            break;
          case '6monthsBefore':
            startDate = moment().subtract(6, 'months').startOf('month').toDate();
            endDate = moment().subtract(6, 'months').endOf('month').toDate();
            break;
          case '1yearBefore':
            startDate = moment().subtract(1, 'years').startOf('year').toDate();
            endDate = moment().subtract(1, 'years').endOf('year').toDate();
            break;
        }
  
        where = {
          ...where,
          createdAt: Between(startDate, endDate),
          status: status || undefined,
        };
      }
  
      const orders = await this.ordersRepository.find({
        where,
        relations: ['user', 'orderItems.product', 'orderItems.licenseKeys'],
        skip,
        take,
        order: {
          [order || 'id']: direction || 'ASC',
        },
      });
  
      if (!orders.length) {
        throw new InternalServerErrorException('Orders is empty');
      }
  
      return orders;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findOne(id: string, username?: string): Promise<Order> {
    try {
      const user = username ? await this.usersService.findOne(username) : undefined;

      const order = await this.ordersRepository.findOne({
        where: { 
          id,
          user: { id: user?.id }
        },
        relations: ['user', 'orderItems.product', 'orderItems.licenseKeys'],
      });

      if(user && !order) {
        throw new InternalServerErrorException(`This user does not have order with id ${id}`);
      }

      if (!order) {
        throw new InternalServerErrorException(`Order with id ${id} is not found`);
      }

      return order;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findOneOrderItem(id: string): Promise<OrderItem> {
    try {
      const orderItem = await this.orderItemsRepository.findOne({
        where: { id },
        relations: ['order', 'product'],
      });

      if (!orderItem) {
        throw new InternalServerErrorException(`Order item with id ${id} is not found`);
      }

      return orderItem;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async changeStatus(id: string, status: string): Promise<void> {
    try {
      const order = await this.findOne(id);
      order.status = status;

      await this.ordersRepository.save(order);
    }
    catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
