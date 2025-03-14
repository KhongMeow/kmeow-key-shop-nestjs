import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { Repository } from 'typeorm';
import { UsersService } from 'src/users/users.service';
import { ProductsService } from 'src/products/products.service';
import { OrderItem } from './entities/order-item.entity';
import { LicenseKeysService } from 'src/license-keys/license-keys.service';
import { of } from 'rxjs';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem) private orderItemsRepository: Repository<OrderItem>,
    private readonly usersService: UsersService,
    private readonly productsService: ProductsService,
    private readonly licenseKeysService: LicenseKeysService,
  ) {}

  async create(createOrderDto: CreateOrderDto, userId: number): Promise<Order> {
    try {      
      const user = await this.usersService.findOne(userId);

      const order = new Order();
      order.email = createOrderDto.email;
      order.user = user;
      order.status = 'Order Created';

      await this.ordersRepository.save(order);

      for (const item of createOrderDto.items) {
        const product = await this.productsService.findOne(item.productId);

        const orderItem = new OrderItem();
        orderItem.order = order;
        orderItem.product = product;
        orderItem.quantity = item.quantity;

        await this.ordersRepository.manager.save(orderItem);

        const licenseKeys = await this.licenseKeysService.findAvailableLicenseKey(product.id, orderItem.quantity);
        for (const licenseKey of licenseKeys) {
          // await this.licenseKeysService.makeOrderdLicenseKey(licenseKey.id, orderItem.id);
        }
      }

      return order;
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
        relations: ['user', 'orderItems.product'],
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

  async changeStatus(id: number, status: string): Promise<Order> {
    try {
      const order = await this.findOne(id);
      order.status = status;

      return await this.ordersRepository.save(order);
    }
    catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
