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
import { BalancesService } from 'src/balances/balances.service';
import { error } from 'console';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    private readonly hashingService: HashingService,
    private readonly rolesService: RolesService,
    private readonly balancesService: BalancesService,
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
      await this.balancesService.create(user);

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
        relations: ['role', 'balance'],
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
        relations: ['role', 'balance'],
      });

      if (!user) {
        throw new NotFoundException(`User with id ${id} is not found`);
      }

      return user;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async myProfile(id: number) {
    try {
      const user = await this.usersRepository.findOne({
        where: { id },
        relations: ['role.rolePermissions.permission', 'balance'],
        select: ['id', 'fullname', 'username', 'email', 'role', 'balance'],
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
      
      if (user) {
        user.role = newRole;
        await this.usersRepository.save(user);

        return {
          statusCode: 200,
          message: `Role changed to ${newRole.name} successfully`
        };
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
  try {
    const user = await this.findOne(id);

    if (
      updateUserDto.fullname &&
      updateUserDto.fullname !== user.fullname
    ) {
      await this.isExistUsername(updateUserDto.fullname);
      user.fullname = updateUserDto.fullname;
    }

    if (
      updateUserDto.email &&
      updateUserDto.email !== user.email
    ) {
      await this.isExistEmail(updateUserDto.email);
      user.email = updateUserDto.email;
    }

    await this.usersRepository.save(user);
    return {
      statusCode: 200,
      message: `User with id ${id} has been updated successfully`,
    };
  } catch (error) {
    if (error instanceof NotFoundException) {
      throw error;
    }
    throw new InternalServerErrorException(
      `Failed to update user: ${error.message}`,
    );
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
      
      await this.usersRepository.softDelete(id);
      if (user.balance) {
        await this.balancesService.remove(user.balance.id);
      }
  
      return {
        statusCode: 200,
        message: `User with id ${id} has been deleted`
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async isExistUsernameOrEmail(username: string, email: string) {
    try {
      const whereByUsername = await this.usersRepository.findOne({
        where: { username },
      });

      const whereByEmail = await this.usersRepository.findOne({
        where: { email },
      });

      if (whereByUsername && whereByEmail) {
        throw new ConflictException(`Username ${username} and email ${email} is already exists!`);
      } else {
        if (whereByUsername) {
          throw new ConflictException(`Username ${username} is already exists!`);
        }
        
        if (whereByEmail) {
          throw new ConflictException(`Email ${email} is already exists!`);
        }
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async isExistUsername(username: string) {
    try {
      const whereByUsername = await this.usersRepository.findOne({
        where: { username },
      });

      if (whereByUsername) {
        return {
          statusCode: 409,
          message: `Username "${username}" is already exists!`
        }
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async isExistEmail(email: string) {
    try {
      const whereByEmail = await this.usersRepository.findOne({
        where: { email },
      });

      if (whereByEmail) {
        return {
          statusCode: 409,
          message: `Email "${email}" is already exists!`
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
