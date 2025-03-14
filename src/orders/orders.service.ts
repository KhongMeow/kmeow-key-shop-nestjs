import { forwardRef, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { Repository } from 'typeorm';
import { UsersService } from 'src/users/users.service';
import { ProductsService } from 'src/products/products.service';
import { OrderItem } from './entities/order-item.entity';
import { LicenseKeysService } from 'src/license-keys/license-keys.service';
import { of } from 'rxjs';
import { BalancesService } from 'src/balances/balances.service';
import { MailService } from 'src/mails/mail.service';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

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
  }

  async create(createOrderDto: CreateOrderDto, userId: number): Promise<Order> {
    try {      
      const user = await this.usersService.findOne(userId);

      const order = new Order();
      order.email = createOrderDto.email;
      order.user = user;
      order.status = 'Order Created';

      await this.ordersRepository.save(order);

      let totalOrderedPrice = 0;
      for (const item of createOrderDto.orderItems) {
        const product = await this.productsService.findOne(item.productId);

        const orderItem = new OrderItem();
        orderItem.order = order;
        orderItem.product = product;

        const licenseKeys = await this.licenseKeysService.findAvailableLicenseKey(product.id, item.quantity);
        for (const licenseKey of licenseKeys) {
          await this.licenseKeysService.makeOrderdLicenseKey(licenseKey.id, orderItem.id);
        }
        
        orderItem.quantity = licenseKeys.length;

        await this.ordersRepository.manager.save(orderItem);
        totalOrderedPrice += product.price * orderItem.quantity;
      }

      await this.changeStatus(order.id, 'Waiting Payment');
      await this.redisClient.set(`waitingPayment:${order.id}`, 'waiting', 'EX', 86400);

      return order;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
  
  async waitingPayment(orderId: number): Promise<void> {
    try {
      const order = await this.findOne(orderId);
      if (order.status === 'Waiting Payment') {
        await this.changeStatus(orderId, 'Cancelled');
        
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

  async confirmPayment(orderId: number, userId: number) {
    try {
      const order = await this.findOne(orderId);
      const user = await this.usersService.findOne(userId);
      
      let totalOrderedPrice = 0;
      for (const item of order.orderItems) {
        for (const licenseKey of item.licenseKeys) {
          await this.licenseKeysService.changeStatus(licenseKey.id, 'Sold');
          totalOrderedPrice += licenseKey.product.price
        }
      }

      await this.balancesService.decreaseAmount(user.balance.id, totalOrderedPrice);
      await this.changeStatus(orderId, 'Paid');
      await this.redisClient.del(`waitingPayment:${orderId}`);

      return await this.mailService.sendMail(
        order.email,
        `Your License Key(s) from K'meow Key Shop`,
        `Your order with id ${orderId} has been confirmed. Here is your license key(s): 
        ${order.orderItems.map(item => item.licenseKeys.map(licenseKey => licenseKey.key).join(', ')).join(', ')}`
      );
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findAll(userId?: number, page?: number, limit?: number, order?: string, direction?: string): Promise<Order[]> {
    try {
      const skip = page && limit ? (page - 1) * limit : undefined;
      const take = limit ? limit : undefined;

      const user = userId ? await this.usersService.findOne(userId) : undefined;

      const orders = await this.ordersRepository.find({
        where: user ? { user: { id: user?.id } } : {},
        relations: ['user'],
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

  async findOne(id: number, userId?: number): Promise<Order> {
    try {
      const user = userId ? await this.usersService.findOne(userId) : undefined;

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

  async findOneOrderItem(id: number): Promise<OrderItem> {
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

  async changeStatus(id: number, status: string): Promise<void> {
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
