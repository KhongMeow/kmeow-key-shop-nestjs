import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GlobalService } from 'src/global/global.service';
import { User } from 'src/users/entities/user.entity';

@Module({
  providers: [GlobalService],
  exports: [GlobalService]
})
export class GlobalModule {}
