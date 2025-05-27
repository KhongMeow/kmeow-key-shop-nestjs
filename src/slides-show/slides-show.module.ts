import { Module } from '@nestjs/common';
import { SlidesShowService } from './slides-show.service';
import { SlidesShowController } from './slides-show.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SlidesShow } from './entities/slides-show.entity';
import { GlobalModule } from 'src/global/global.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SlidesShow]),
    GlobalModule,
  ],
  controllers: [SlidesShowController],
  providers: [SlidesShowService],
})
export class SlidesShowModule {}
