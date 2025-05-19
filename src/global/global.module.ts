import { Module } from '@nestjs/common';
import { GlobalService } from 'src/global/global.service';

@Module({
  providers: [GlobalService],
  exports: [GlobalService]
})
export class GlobalModule {}
