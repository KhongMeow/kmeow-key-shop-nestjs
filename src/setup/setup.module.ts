import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { Permission } from '../permissions/entities/permission.entity';
import { RolePermission } from '../role-permissions/entities/role-permission.entity';
import { SetupService } from './setup.service';
import { IdentityModule } from 'src/identity/identity.module';
import { PermissionsModule } from 'src/permissions/permissions.module';
import { RolePermissionsModule } from 'src/role-permissions/role-permissions.module';
import { RolesModule } from 'src/roles/roles.module';
import { SetupController } from './setup.controller';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, Permission, RolePermission]),
    RolesModule,
    PermissionsModule,
    RolePermissionsModule,
    UsersModule,
  ],
  providers: [SetupService],
  controllers: [SetupController],
})
export class SetupModule {}