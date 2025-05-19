import { forwardRef, Module } from '@nestjs/common';
import { LicenseKeysService } from './license-keys.service';
import { LicenseKeysController } from './license-keys.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LicenseKey } from './entities/license-key.entity';
import { ProductsModule } from 'src/products/products.module';
import { OrdersModule } from 'src/orders/orders.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LicenseKey]),
    ProductsModule,
    forwardRef(() => OrdersModule)
  ],
  controllers: [LicenseKeysController],
  providers: [LicenseKeysService],
  exports: [LicenseKeysService],
})
export class LicenseKeysModule {}
