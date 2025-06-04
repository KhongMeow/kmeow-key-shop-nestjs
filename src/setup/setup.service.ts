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
      await this.rolesService.create(role);
    }
  }

  private async createDefaultPermissions() {
    const defaultPermissions: CreatePermissionDto[] = [
      { name: 'Access Dashboard' },
      { name: 'Access Users Setting' },
      { name: 'Create Role' },
      { name: 'List Roles' },
      { name: 'Select Role' },
      { name: 'Update Role' },
      { name: 'Delete Role' },
      { name: 'Create Permission' },
      { name: 'List Permissions' },
      { name: 'Select Permission' },
      { name: 'Update Permission' },
      { name: 'Delete Permission' },
      { name: 'Create Role Permission' },
      { name: 'List Role Permissions' },
      { name: 'Select Role Permission' },
      { name: 'Update Role Permission' },
      { name: 'Delete Role Permission' },
      { name: 'Create User' },
      { name: 'List Users' },
      { name: 'Select User' },
      { name: 'Change Role User' },
      { name: 'Reset Password User' },
      { name: 'Delete User' },
      { name: 'Create Slide Show' },
      { name: 'List Slides Show' },
      { name: 'Select Slide Show' },
      { name: 'Update Slide Show' },
      { name: 'Delete Slide Show' },
      { name: 'Create Category' },
      { name: 'Update Category' },
      { name: 'Delete Category' },
      { name: 'Create Product' },
      { name: 'Update Product' },
      { name: 'Delete Product' },
      { name: 'Create License Key' },
      { name: 'List License Keys' },
      { name: 'Count License Keys' },
      { name: 'Select License Key' },
      { name: 'Update License Key' },
      { name: 'Delete License Key' },
      { name: 'List Orders' },
      { name: 'Select Order' },
      { name: 'List Balances' },
      { name: 'Select Balance' },
      { name: 'Delete Balance' },
      { name: 'Increase Amount' },
      { name: 'Decrease Amount' },
    ];

    for (const permission of defaultPermissions) {
      await this.permissionsService.create(permission);
    }
  }

  private async createDefaultRolePermissions() {
    const adminRole = await this.rolesService.findOne('admin');
    const permissions = await this.permissionsService.findAll();

    const defaultRolePermissions: CreateRolePermissionDto[] = permissions.map(permission => ({
      roleSlug: adminRole.slug,
      permissionSlug: permission.slug,
    }));

    for (const rolePermission of defaultRolePermissions) {
      await this.rolePermissionsService.create(rolePermission);
    }
  }

  private async createDefaultUser() {
    const adminRole = await this.rolesService.findOne('admin');

    const defaultUser: CreateUserDto = {
      fullname: 'System Admin',
      username: 'system-admin',
      email: 'system_admin@example.com',
      password: 'admin123',
      roleSlug: adminRole.slug,
    };

    await this.usersService.create(defaultUser);
  }
}