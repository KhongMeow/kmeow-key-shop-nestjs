import { forwardRef, Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import jwtConfig from 'src/identity/config/jwt.config';
import { RolesModule } from 'src/roles/roles.module';
import { ProductsModule } from 'src/products/products.module';
import { LicenseKeysModule } from 'src/license-keys/license-keys.module';
import { BalancesModule } from 'src/balances/balances.module';
import { MailModule } from 'src/mails/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem]),
    JwtModule.registerAsync(jwtConfig.asProvider()),
    ConfigModule.forFeature(jwtConfig),
    RolesModule,
    UsersModule,
    ProductsModule,
    forwardRef(() => LicenseKeysModule),
    BalancesModule,
    MailModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService]
})
export class OrdersModule {}
