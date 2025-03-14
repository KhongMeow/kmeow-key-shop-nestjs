import { forwardRef, Module } from '@nestjs/common';
import { LicenseKeysService } from './license-keys.service';
import { LicenseKeysController } from './license-keys.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LicenseKey } from './entities/license-key.entity';
import { ProductsModule } from 'src/products/products.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { RolesModule } from 'src/roles/roles.module';
import jwtConfig from 'src/identity/config/jwt.config';
import { OrdersModule } from 'src/orders/orders.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LicenseKey]),
    JwtModule.registerAsync(jwtConfig.asProvider()),
    ConfigModule.forFeature(jwtConfig),
    RolesModule,
    ProductsModule,
    forwardRef(() => OrdersModule)
  ],
  controllers: [LicenseKeysController],
  providers: [LicenseKeysService],
  exports: [LicenseKeysService],
})
export class LicenseKeysModule {}
