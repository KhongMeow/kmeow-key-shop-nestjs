import { forwardRef, Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { UsersModule } from 'src/users/users.module';
import { ConfigModule } from '@nestjs/config';
import { ProductsModule } from 'src/products/products.module';
import { LicenseKeysModule } from 'src/license-keys/license-keys.module';
import { BalancesModule } from 'src/balances/balances.module';
import { MailModule } from 'src/mails/mail.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem]),
    ConfigModule,
    UsersModule,
    ProductsModule,
    forwardRef(() => LicenseKeysModule),
    BalancesModule,
    MailModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService]
})
export class OrdersModule {}
