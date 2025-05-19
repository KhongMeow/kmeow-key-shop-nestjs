import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { Repository } from 'typeorm';
import { GlobalService } from 'src/global/global.service';

@Injectable()
export class RolesService {
  constructor(
    private readonly globalService: GlobalService,
    @InjectRepository(Role) private readonly rolesReposotory: Repository<Role>
  ) {}

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    try {
      await this.isExistRole(createRoleDto.name);

      const role = new Role();
      role.name = createRoleDto.name;
      role.slug = await this.globalService.convertToSlug(createRoleDto.name);

      return await this.rolesReposotory.save(role);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findAll(page?: number, limit?: number, order?: string, direction?: string): Promise<Role[]> {
    try {
      const skip = page && limit ? (page - 1) * limit : undefined;
      const take = limit ? limit : undefined;

      const roles = await this.rolesReposotory.find({
        skip,
        take,
        order: {
          [order ? order : 'id']: direction ? direction : 'ASC',
        }
      });

      if (roles.length === 0) {
        throw new NotFoundException('Roles is empty');
      }

      return roles;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findOne(id: number): Promise<Role> {
    try {
      const role = await this.rolesReposotory.findOneBy({ id });

      if (!role) {
        throw new NotFoundException(`Role with id ${id} is not found`);
      }

      return role;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findOneBySlug(slug: string): Promise<Role> {
    try {
      const role = await this.rolesReposotory.findOneBy({ slug });

      if (!role) {
        throw new NotFoundException(`Role with slug ${slug} is not found`);
      }

      return role;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async getPermissionsInRole(id: number): Promise<Role> {
    try {
      const role = await this.rolesReposotory.findOne({
        where: { id },
        relations: ['rolePermissions.permission'],
      });

      if (!role) {
        throw new NotFoundException(`Role with id ${id} is not found`);
      }

      return role;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async update(id: number, updateRoleDto: UpdateRoleDto): Promise<Role> {
    try {
      if (updateRoleDto.name) {
        const role = await this.findOne(id);
        await this.isExistRole(updateRoleDto.name);

        role.name = updateRoleDto.name;
        role.slug = await this.globalService.convertToSlug(updateRoleDto.name);

        return await this.rolesReposotory.save(role);
      } else {
        throw new BadRequestException('Role name must be provided');
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async remove(id: number): Promise<{ status: number, message: string }> {
    try {
      const role = await this.findOne(id);

      if(role.users.length > 0) {
        throw new ConflictException(`This role was used by ${role.users.length} user(s)`);
      }

      if (role.rolePermissions.length > 0) {
        throw new ConflictException(`This role was used by ${role.rolePermissions.length} role permission(s)`);
      }

      await this.rolesReposotory.softDelete(id);

      return {
        status: 200,
        message: `Role with id ${id} has been deleted`
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async isExistRole(name: string): Promise<void> {
    try {
      const role = await this.rolesReposotory.findOne({
        where: [
          { name },
          { slug: await this.globalService.convertToSlug(name) }
        ],
      })
  
      if (role) {
        throw new ConflictException('Role already exists');
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
