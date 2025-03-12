import { BadRequestException, ConflictException, Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import * as generator from 'generate-password';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { HashingService } from 'src/identity/hashing/hashing.service';
import { RolesService } from 'src/roles/roles.service';
import { JwtService } from '@nestjs/jwt';
import jwtConfig from 'src/identity/config/jwt.config';
import { ConfigType } from '@nestjs/config';
import { MailService } from 'src/mails/mail.service';
import { ChangeRoleDto } from './dto/change-role.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    private readonly hashingService: HashingService,
    private readonly rolesService: RolesService,
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY) private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
    private readonly mailsService: MailService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    try {
      const role = await this.rolesService.findOne(createUserDto.roleId);
      await this.isExistUsernameOrEmail(createUserDto.username, createUserDto.email);

      const user = new User();
      user.fullname = createUserDto.fullname;
      user.username = createUserDto.username;
      user.email = createUserDto.email;
      user.password = await this.hashingService.hash(createUserDto.password);
      user.role = role;
    
      await this.usersRepository.save(user);
      return user;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findAll(page?: number, limit?: number, order?: string, direction?: string) {
    try {
      const skip = page && limit ? (page -1) * limit : undefined;
      const take = limit ?? undefined;

      const users = await this.usersRepository.find({
        relations: ['role'],
        skip,
        take,
        order: {
          [order || 'id']: direction || 'asc',
        }
      });

      return users;
    } catch (error) {
      throw new BadRequestException(`Failed to fetch users: ${error.message}`);
    }
  }

  async findOne(id: number) {
    try {
      const user = await this.usersRepository.findOne({
        where: { id },
        relations: ['role'],
      });

      if (!user) {
        throw new NotFoundException(`User with id ${id} is not found`);
      }

      return user;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async changeRole(id: number, changeRoleDto: ChangeRoleDto) {
    try {
      const user = await this.findOne(id);
      const newRole = await this.rolesService.findOne(changeRoleDto.newRoleId);
      
      if (user?.role.id === changeRoleDto.currentRoleId) {
        user.role = newRole;
        await this.usersRepository.save(user);

        return {
          statusCode: 200,
          message: `Role changed to ${newRole.name} successfully`
        };
      } else {
        throw new BadRequestException('User role does not match current role');
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async resetPassword(id: number) {
    try {
      const user = await this.findOne(id);
      const newPassword = await this.generateSecurePassword();
      
      if (user) {
        user.password = await this.hashingService.hash(newPassword);
        await this.usersRepository.save(user);
        await this.mailsService.sendMail(user.email, "Password Reset", `Your new password is: ${newPassword}`);

        return {
          statusCode: 200,
          message: `Password reset successfully! Please check your email for the new password`
        };
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async remove(id: number) {
    try {
      const user = await this.findOne(id);

      await this.usersRepository.remove(user);

      return {
        statusCode: 200,
        message: `Deleted user with id ${id} successfully`
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async isExistUsernameOrEmail(username: string, email: string) {
    try {
      const whereByUsername = await this.usersRepository.findOne({
        where: { username },
        relations: ['role'],
      });

      const whereByEmail = await this.usersRepository.findOne({
        where: { email },
        relations: ['role'],
      });

      if (whereByUsername && whereByEmail) {
        throw new ConflictException(`User with username ${username} and email ${email} already exists`);
      } else {
        if (whereByUsername) {
          throw new ConflictException(`User with username ${username} already exists`);
        }
        
        if (whereByEmail) {
          throw new ConflictException(`User with email ${email} already exists`);
        }
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  private async generateSecurePassword() {
    return generator.generate({
      length: 16,
      numbers: true,
      symbols: true,
      uppercase: true,
      lowercase: true,
      exclude: '',
      strict: true,
    });
  }
}
