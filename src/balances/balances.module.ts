import { Module } from '@nestjs/common';
import { BalancesService } from './balances.service';
import { BalancesController } from './balances.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Balance } from './entities/balance.entity';
import { User } from 'src/users/entities/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import jwtConfig from 'src/identity/config/jwt.config';
import { RolesModule } from 'src/roles/roles.module';

@Module({
  imports: 
      [TypeOrmModule.forFeature([Balance, User]),
      JwtModule.registerAsync(jwtConfig.asProvider()),
      ConfigModule.forFeature(jwtConfig),
      RolesModule
    ],
  controllers: [BalancesController],
  providers: [BalancesService],
  exports: [BalancesService],
})
export class BalancesModule {}
