import { Module } from '@nestjs/common';
import { SlidesShowService } from './slides-show.service';
import { SlidesShowController } from './slides-show.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SlidesShow } from './entities/slides-show.entity';
import jwtConfig from 'src/identity/config/jwt.config';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { RolesModule } from 'src/roles/roles.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SlidesShow]),
    JwtModule.registerAsync(jwtConfig.asProvider()),
    ConfigModule.forFeature(jwtConfig),
    RolesModule,
  ],
  controllers: [SlidesShowController],
  providers: [SlidesShowService],
})
export class SlidesShowModule {}
