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
import { GlobalService } from 'src/global/global.service';

@Injectable()
export class RolePermissionsService {
  constructor(
    @InjectRepository(RolePermission) private readonly rolePermissionsRepository: Repository<RolePermission>,
    private readonly rolesService: RolesService,
    private readonly permissionsService: PermissionsService,
    private readonly globalService: GlobalService,
  ) {}

  async create(createRolePermissionDto: CreateRolePermissionDto): Promise<RolePermission> {
    try {
      const role = await this.rolesService.findOne(createRolePermissionDto.roleSlug);
      const permission = await this.permissionsService.findOne(createRolePermissionDto.permissionSlug);
      await this.isExistRolePermission(role, permission);

      const rolePermission = new RolePermission();
      rolePermission.slug = await this.globalService.convertToSlug(`${permission.slug}-on-${role.slug}`);
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

  async findOne(slug: string): Promise<RolePermission> {
    try {
      const rolePermission = await this.rolePermissionsRepository.findOne({
        where: { slug },
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

  async update(slug: string, updateRolePermissionDto: UpdateRolePermissionDto): Promise<RolePermission> {
    try {
      const rolePermission = await this.findOne(slug);
      const { roleSlug, permissionSlug } = updateRolePermissionDto;

      if (roleSlug === undefined || permissionSlug === undefined) {
        throw new BadRequestException('Role or Permission must be defined');
      }

      const effectiveRoleSlug = roleSlug !== undefined ? roleSlug : rolePermission.role.slug;
      const effectivePermissionSlug = permissionSlug !== undefined ? permissionSlug : rolePermission.permission.slug;

      const newRole = await this.rolesService.findOne(effectiveRoleSlug);
      const newPermission = await this.permissionsService.findOne(effectivePermissionSlug);

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

  async remove(slug: string): Promise<{ status: number; message: string }> {
    try {
      const rolePermission = await this.findOne(slug);
      await this.rolePermissionsRepository.softDelete(rolePermission.id);

      return {
        status: 200,
        message: `This role permission has been deleted`,
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  private async isExistRolePermission(role: Role, permission: Permission) {
    try {
      const isExist = await this.rolePermissionsRepository.findOne({
        where: {
          role: { id: role.id },
          permission: { id: permission.id },
        },
      });

      if (isExist) {
        throw new InternalServerErrorException('Role Permission is already exist');
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
