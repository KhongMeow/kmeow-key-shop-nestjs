import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { Permission } from './entities/permission.entity';
import { GlobalService } from 'src/global/global.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class PermissionsService {
  constructor(
    private readonly globalService: GlobalService,
    @InjectRepository(Permission) private readonly permissionsRepository: Repository<Permission>
  ) {}

  async create(createPermissionDto: CreatePermissionDto): Promise<Permission> {
    try {
      await this.isExistPermission(createPermissionDto.name);

      const permission = new Permission();
      permission.name = createPermissionDto.name;
      permission.slug = await this.globalService.convertToSlug(createPermissionDto.name);

      return await this.permissionsRepository.save(permission);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findAll(page?: number, limit?: number, order?: string, direction?: string): Promise<Permission[]> {
    try {
      const skip = page && limit ? (page - 1) * limit : undefined;
      const take = limit ? limit : undefined;

      const permissions = await this.permissionsRepository.find({
        relations: ['rolePermissions.role'],
        skip,
        take,
        order: {
          [order ? order : 'id']: direction ? direction : 'ASC',
        },
      });

      if (permissions.length === 0) {
        throw new InternalServerErrorException('Permissions is empty');
      }

      return permissions;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findOne(id: number): Promise<Permission> {
    try {
      const permission = await this.permissionsRepository.findOne({
        where: { id },
        relations: ['rolePermissions.role'],
      });

      if (!permission) {
        throw new InternalServerErrorException(`Permission with id ${id} is not found`);
      }

      return permission;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async update(id: number, updatePermissionDto: UpdatePermissionDto): Promise<Permission> {
    try {
      if (updatePermissionDto.name) {
        const permission = await this.findOne(id);
        await this.isExistPermission(updatePermissionDto.name);

        permission.name = updatePermissionDto.name;
        permission.slug = await this.globalService.convertToSlug(updatePermissionDto.name);

        return await this.permissionsRepository.save(permission);
      } else {
        throw new BadRequestException('Permission name must be provided');
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async remove(id: number): Promise<{ status: number; message: string }> {
    try {
      const permission = await this.findOne(id);

      if (permission.rolePermissions.length > 0) {
        throw new BadRequestException(`This permission was used by ${permission.rolePermissions.length} role permission(s)`)
      }

      await this.permissionsRepository.softDelete(id);

      return {
        status: 200,
        message: `Permission with id ${id} has been deleted`
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  private async isExistPermission(name: string): Promise<void> {
    const permission = await this.permissionsRepository.findOne({
      where: [
        { name },
        { slug: await this.globalService.convertToSlug(name) }
      ],
    });

    if (permission) {
      throw new InternalServerErrorException(`Permission with name ${name} is already exist`);
    }
  }
}
