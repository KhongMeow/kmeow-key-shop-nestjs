import { ConflictException, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { RolesService } from '../roles/roles.service';
import { PermissionsService } from '../permissions/permissions.service';
import { RolePermissionsService } from '../role-permissions/role-permissions.service';
import { CreateRoleDto } from '../roles/dto/create-role.dto';
import { CreatePermissionDto } from '../permissions/dto/create-permission.dto';
import { CreateRolePermissionDto } from '../role-permissions/dto/create-role-permission.dto';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class SetupService {
  constructor(
    private readonly usersService: UsersService,
    private readonly rolesService: RolesService,
    private readonly permissionsService: PermissionsService,
    private readonly rolePermissionsService: RolePermissionsService,
  ) {}

  async executeSetup() {
    await this.createDefaultRoles();
    await this.createDefaultPermissions();
    await this.createDefaultRolePermissions();
    await this.createDefaultUser();
  }

  private async createDefaultRoles() {
    const defaultRoles: CreateRoleDto[] = [
      { name: 'Admin' },
      { name: 'User' },
    ];

    for (const role of defaultRoles) {
      try {
        await this.rolesService.create(role);
      } catch (error) {
        if (error instanceof ConflictException) {
          console.log(`Role ${role.name} already exists. Skipping...`);
        } else {
          throw error;
        }
      }
    }
  }

  private async createDefaultPermissions() {
    const defaultPermissions: CreatePermissionDto[] = [
      { name: 'Create Role' },
      { name: 'Read Role' },
      { name: 'Update Role' },
      { name: 'Delete Role' },
      { name: 'Create Permission' },
      { name: 'Read Permission' },
      { name: 'Update Permission' },
      { name: 'Delete Permission' },
      { name: 'Create Role Permission' },
      { name: 'Read Role Permission' },
      { name: 'Update Role Permission' },
      { name: 'Delete Role Permission' },
      { name: 'Create User' },
      { name: 'Read User' },
      { name: 'Update User' },
      { name: 'Delete User' },
    ];

    for (const permission of defaultPermissions) {
      try {
        await this.permissionsService.create(permission);
      } catch (error) {
        if (error instanceof ConflictException) {
          console.log(`Permission "${permission.name}" already exists. Skipping...`);
        } else {
          throw error;
        }
      }
    }
  }

  private async createDefaultRolePermissions() {
    const adminRole = await this.rolesService.findOneBySlug('admin');
    const permissions = await this.permissionsService.findAll();

    const defaultRolePermissions: CreateRolePermissionDto[] = permissions.map(permission => ({
      roleId: adminRole.id,
      permissionId: permission.id,
    }));

    for (const rolePermission of defaultRolePermissions) {
      try {
        await this.rolePermissionsService.create(rolePermission);
      } catch (error) {
        if (error instanceof ConflictException) {
          console.log(`Role-Permission already exists. Skipping...`);
        } else {
          throw error;
        }
      }
    }
  }

  private async createDefaultUser() {
    const adminRole = await this.rolesService.findOneBySlug('admin');

    const defaultUser: CreateUserDto = {
      fullname: 'System Admin',
      username: 'system-admin',
      email: 'system_admin@example.com',
      password: 'admin123',
      roleId: adminRole.id,
    };

    try {
      await this.usersService.create(defaultUser);
    } catch (error) {
      if (error instanceof ConflictException) {
        console.log(`Default user "${defaultUser.username}" already exists. Skipping...`);
      } else {
        throw error;
      }
    }
  }
}