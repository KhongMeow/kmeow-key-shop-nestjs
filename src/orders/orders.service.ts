import { forwardRef, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { Repository } from 'typeorm';
import { UsersService } from 'src/users/users.service';
import { ProductsService } from 'src/products/products.service';
import { OrderItem } from './entities/order-item.entity';
import { LicenseKeysService } from 'src/license-keys/license-keys.service';
import { BalancesService } from 'src/balances/balances.service';
import { MailService } from 'src/mails/mail.service';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { Between } from 'typeorm';
import * as moment from 'moment';

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
    private readonly configService: ConfigService,
  ) {
    this.redisClient = new Redis({
      host: this.configService.get('REDIS_HOST'),
      port: this.configService.get('REDIS_PORT'),
      password: this.configService.get("REDIS_PASS")
    });

    // Subscribe to Redis key expiration events for waitingPayment
    const sub = new Redis({
      host: this.configService.get('REDIS_HOST'),
      port: this.configService.get('REDIS_PORT'),
      password: this.configService.get("REDIS_PASS")
    });

    sub.psubscribe('__keyevent@0__:expired', (err, count) => {
      if (err) {
        console.error('Failed to subscribe to Redis key expiration events:', err);
      }
    });

    sub.on('pmessage', async (pattern, channel, message) => {
      if (message.startsWith('waitingPayment:')) {
        const orderId = message.split(':')[1];
        await this.waitingPayment(orderId);
      }
    });
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

      await this.changeStatus(order.id, 'Waiting Payment');
      await this.redisClient.set(`waitingPayment:${order.id}`, 'waiting', 'EX', 10);

      return order;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
  
  async waitingPayment(orderId: string): Promise<void> {
    try {
      const order = await this.findOne(orderId);
      if (order.status === 'Waiting Payment') {
        await this.changeStatus(orderId, 'Cancelled');
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
      await this.ordersRepository.save(order);
      await this.changeStatus(orderId, 'Paid');
      await this.redisClient.del(`waitingPayment:${orderId}`);

      // Start Delivering
      await this.mailService.sendMail(
        order.email,
        `Your License Key(s) from K'meow Key Shop`,
        `Your order with id ${orderId} has been confirmed. Here is your license key(s): 
        ${order.orderItems.map(item => item.licenseKeys.map(licenseKey => licenseKey.key).join(', ')).join(', ')}`
      );
      order.deliveredAt = new Date();
      await this.changeStatus(orderId, 'Delivered');
      await this.ordersRepository.save(order);
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
