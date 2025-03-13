import { Module } from '@nestjs/common';
import { LicenseKeysService } from './license-keys.service';
import { LicenseKeysController } from './license-keys.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LicenseKey } from './entities/license-key.entity';
import { ProductsModule } from 'src/products/products.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { RolesModule } from 'src/roles/roles.module';
import jwtConfig from 'src/identity/config/jwt.config';

@Module({
  imports: [
    TypeOrmModule.forFeature([LicenseKey]),
    JwtModule.registerAsync(jwtConfig.asProvider()),
    ConfigModule.forFeature(jwtConfig),
    RolesModule,
    ProductsModule,
  ],
  controllers: [LicenseKeysController],
  providers: [LicenseKeysService],
})
export class LicenseKeysModule {}
