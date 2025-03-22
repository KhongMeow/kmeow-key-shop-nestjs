import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Balance } from './entities/balance.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class BalancesService {
  constructor(
    @InjectRepository(Balance) private readonly balancesRepository: Repository<Balance>,
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
  ) {}
  async create(user: User): Promise<Balance> {
    try {
      const balance = new Balance();
      balance.user = user;

      return await this.balancesRepository.save(balance);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findAll(page?: number, limit?: number, order?: string, direction?: string): Promise<Balance[]> {
    try {
      const skip = page && limit ? (page - 1) * limit : undefined;
      const take = limit ? limit : undefined;

      const balances = await this.balancesRepository.find({
        relations: ['user'],
        take,
        skip,
        order: {
          [order || 'id']: direction || 'ASC',
        },
      });

      if (balances.length === 0) {
        throw new NotFoundException('Balances is empty');
      }

      return balances;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findOne(id: number): Promise<Balance> {
    try {
      const balance = await this.balancesRepository.findOne({
        where: { id },
        relations: ['user'],
      });

      if (!balance) {
        throw new NotFoundException(`Balance with id ${id} is not found`);
      }

      return balance;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async myBalance(userId: number): Promise<Balance> {
    try {
      const balance = await this.balancesRepository.findOne({
        where: { user: {id: userId} },
        relations: ['user'],
      });

      if (!balance) {
        throw new NotFoundException('Can not find balance your balance');
      }

      return balance; 
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async increaseAmount(id: number, amount: number) {
    try {
      const balance = await this.findOne(id);
      balance.amount += amount;

      return await this.balancesRepository.save(balance);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async decreaseAmount(id: number, amount: number) {
    try {
      const balance = await this.findOne(id);

      if (balance.amount < amount) {
        throw new InternalServerErrorException('Insufficient balance');
      }
      
      balance.amount -= amount;

      return await this.balancesRepository.save(balance);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async remove(id: number): Promise<{ statusCode: number; message: string }> {
    try {
      const balance = await this.findOne(id);
  
      await this.balancesRepository.softDelete(id);
  
      return {
        statusCode: 200,
        message: `Balance with id ${id} has been deleted`,
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
