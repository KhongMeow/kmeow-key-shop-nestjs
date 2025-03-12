import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import jwtConfig from 'src/identity/config/jwt.config';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { HashingService } from 'src/identity/hashing/hashing.service';
import { BcryptService } from 'src/identity/hashing/bcrypt.service';
import { RolesModule } from 'src/roles/roles.module';
import { MailService } from 'src/mails/mail.service';
import { Role } from 'src/roles/entities/role.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role]),
    JwtModule.registerAsync(jwtConfig.asProvider()),
    ConfigModule.forFeature(jwtConfig),
    RolesModule,
  ],
  providers: [
    {
      provide: HashingService,
      useClass: BcryptService,
    },
    UsersService,
    MailService,
  ],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
