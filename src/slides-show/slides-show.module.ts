import { Module } from '@nestjs/common';
import { SlidesShowService } from './slides-show.service';
import { SlidesShowController } from './slides-show.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SlidesShow } from './entities/slides-show.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SlidesShow]),
  ],
  controllers: [SlidesShowController],
  providers: [SlidesShowService],
})
export class SlidesShowModule {}
