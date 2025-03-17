import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { RolePermissionsModule } from './role-permissions/role-permissions.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { IdentityModule } from './identity/identity.module';
import { GlobalModule } from './global/global.module';
import { MailModule } from './mails/mail.module';
import { SetupModule } from './setup/setup.module';
import { BalancesModule } from './balances/balances.module';
import { SlidesShowModule } from './slides-show/slides-show.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { LicenseKeysModule } from './license-keys/license-keys.module';
import { OrdersModule } from './orders/orders.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'node:path';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USER'),
        password: configService.get('DB_PASS'),
        database: configService.get('DB_NAME'),
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'images'),
      serveRoot: '/images',
    }),
    GlobalModule,
    MailModule,
    SetupModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    RolePermissionsModule,
    IdentityModule,
    BalancesModule,
    SlidesShowModule,
    CategoriesModule,
    ProductsModule,
    LicenseKeysModule,
    OrdersModule,
  ],
})
export class AppModule {}
