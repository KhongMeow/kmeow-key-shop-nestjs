import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateRolePermissionDto } from './dto/create-role-permission.dto';
import { UpdateRolePermissionDto } from './dto/update-role-permission.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { RolePermission } from './entities/role-permission.entity';
import { Repository } from 'typeorm';
import { PermissionsService } from 'src/permissions/permissions.service';
import { RolesService } from 'src/roles/roles.service';
import { Role } from 'src/roles/entities/role.entity';
import { Permission } from 'src/permissions/entities/permission.entity';

@Injectable()
export class RolePermissionsService {
  constructor(
    @InjectRepository(RolePermission) private readonly rolePermissionsRepository: Repository<RolePermission>,
    private readonly rolesService: RolesService,
    private readonly permissionsService: PermissionsService,
  ) {}

  async create(createRolePermissionDto: CreateRolePermissionDto): Promise<RolePermission> {
    try {
      const role = await this.rolesService.findOne(createRolePermissionDto.roleId);
      const permission = await this.permissionsService.findOne(createRolePermissionDto.permissionId);
      await this.isExistRolePermission(role, permission);

      const rolePermission = new RolePermission();
      rolePermission.role = role;
      rolePermission.permission = permission;

      return await this.rolePermissionsRepository.save(rolePermission);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findAll(page?: number, limit?: number, order?: string, direction?: string): Promise<RolePermission[]> {
    try {
      const skip = page && limit ? (page - 1) * limit : undefined;
      const take = limit ? limit : undefined;

      const rolePermissions = await this.rolePermissionsRepository.find({
        relations: ['role', 'permission'],
        skip,
        take,
        order: {
          [order ? order : 'id']: direction ? direction : 'ASC',
        },
      });

      if (rolePermissions.length === 0) {
        throw new NotFoundException('RolePermissions is empty');
      }

      return rolePermissions;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findOne(id: number): Promise<RolePermission> {
    try {
      const rolePermission = await this.rolePermissionsRepository.findOne({
        where: { id },
        relations: ['role', 'permission'],
      });

      if (!rolePermission) {
        throw new NotFoundException('RolePermission is not found');
      }

      return rolePermission;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async update(id: number, updateRolePermissionDto: UpdateRolePermissionDto): Promise<RolePermission> {
    try {
      const rolePermission = await this.findOne(id);
      const { roleId, permissionId } = updateRolePermissionDto;

      if (roleId === undefined || permissionId === undefined) {
        throw new BadRequestException('Role or Permission must be defined');
      }

      const effectiveRoleId = roleId !== undefined ? roleId : rolePermission.role.id;
      const effectivePermissionId = permissionId !== undefined ? permissionId : rolePermission.permission.id;

      const newRole = await this.rolesService.findOne(effectiveRoleId);
      const newPermission = await this.permissionsService.findOne(effectivePermissionId);

      await this.isExistRolePermission(newRole, newPermission);

      if (!newRole || !newPermission) {
        throw new BadRequestException('Role or Permission must be defined');
      }

      rolePermission.role = newRole;
      rolePermission.permission = newPermission;

      return await this.rolePermissionsRepository.save(rolePermission);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async remove(id: number): Promise<{ status: number; message: string }> {
    try {
      const rolePermission = await this.findOne(id);
      await this.rolePermissionsRepository.softDelete(id);

      return {
        status: 200,
        message: `Role Permission with id ${id} has been deleted`,
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  private async isExistRolePermission(role: Role, permission: Permission) {
    const isExist = await this.rolePermissionsRepository.findOne({
      where: { role, permission },
    });

    if (isExist) {
      throw new InternalServerErrorException('Role Permission is already exist');
    }
  }
}
