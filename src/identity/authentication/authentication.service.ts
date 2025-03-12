import { BadRequestException, Inject, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { SignUpDto } from './dto/sign-up.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { In, Repository } from 'typeorm';
import { HashingService } from '../hashing/hashing.service';
import { RolesService } from 'src/roles/roles.service';
import { SignInDto } from './dto/sign-in.dto';
import { JwtService } from '@nestjs/jwt';
import jwtConfig from '../config/jwt.config';
import { ConfigService, ConfigType } from '@nestjs/config';
import { InvalidatedRefreshTokenError, RefreshTokenIdsStorage } from './refresh-token-ids.storage';
import { MailService } from 'src/mails/mail.service';
import { randomUUID } from 'crypto';
import { ActiveUserData } from '../interfaces/active-user-data.interface';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import Redis from 'ioredis';
import { SendVerifyEmailDto } from './dto/send-verify-email.dto';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthenticationService {
  private redis: Redis;

  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    private readonly usersService: UsersService,
    private readonly hashingService: HashingService,
    private readonly rolesService: RolesService,
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY) private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
    private readonly refreshTokenIdsStorage: RefreshTokenIdsStorage,
    private readonly mailsService: MailService,
    private readonly configService: ConfigService,
  ) {
    this.redis = new Redis({
      host: configService.get('REDIS_HOST'),
      port: configService.get('REDIS_PORT'),
      password: configService.get('REDIS_PASS'),
    });
  }

  async sendVerificationEmail(sendVerifyEmailDto: SendVerifyEmailDto): Promise<void> {
    try {
      const { email } = sendVerifyEmailDto;
      // Check if a verification code already exists for the email
      const existingCode = await this.redis.get(`verificationCode:${email}`);
      
      let verificationCode: string;
      if (existingCode) {
        verificationCode = existingCode; // Use the existing code
      } else {
        verificationCode = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a new 6-digit code
        await this.redis.set(`verificationCode:${email}`, verificationCode, 'EX', 3600); // Store the code in Redis with a 1-hour expiration
      }
  
      await this.mailsService.sendMail(email, 'Email Verification', `Your verification code is: ${verificationCode}`);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    try {
      const { email, code } = verifyEmailDto;
      const storedCode = await this.redis.get(`verificationCode:${email}`);
  
      if (!storedCode) {
        throw new BadRequestException('Verification code expired or not found');
      }
  
      if (storedCode !== code) {
        throw new BadRequestException('Invalid verification code');
      }

      await this.redis.del(`verificationCode:${email}`); // Remove the code from Redis after successful verification
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async signUp(signUpDto: SignUpDto) {
    try {
      const defualtRole = await this.rolesService.findOneBySlug('user');
      if (!defualtRole) {
        throw new Error('Default role not found');
      }
      await this.usersService.isExistUsernameOrEmail(signUpDto.username, signUpDto.email);

      const user = new User();
      user.fullname = signUpDto.fullname;
      user.username = signUpDto.username;
      user.email = signUpDto.email;
      user.password = await this.hashingService.hash(signUpDto.password);
      user.role = defualtRole;

      await this.usersRepository.save(user);
      return user;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async signIn(signInDto: SignInDto) {
    try {
      const user = await this.usersRepository.findOne({
        where: [
          { username: signInDto.usernameOrEmail },
          { email: signInDto.usernameOrEmail },
        ],
        relations: ['role'],
      });

      if (!user) {
        throw new NotFoundException(`User with username or email ${signInDto.usernameOrEmail} is not found`);
      }

      const isPasswordCorrect = await this.hashingService.compare(
        signInDto.password,
        user.password
      );
      if (!isPasswordCorrect) {
        throw new BadRequestException('Incorrect password');
      }

      return await this.generateTokens(user);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async signOut(userId: number) {
    try {
      const isTokenValid = await this.refreshTokenIdsStorage.isTokenValid(userId);

      if (isTokenValid) {
        await this.refreshTokenIdsStorage.invalidate(userId);
        await this.redis.del(`accessToken:${userId}`);
        await this.redis.set(`blacklist:${userId}`, 'true', 'EX', this.jwtConfiguration.accessTokenTtl);
        return { message: 'User signed out' };
      } else {
        throw new BadRequestException('User is not signed in');
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  private async generateTokens(user: User) {
    const refreshTokenId = randomUUID();
    const [accessToken, refreshToken] = await Promise.all([
      this.signToken<Partial<ActiveUserData>>(
        user.id,
        this.jwtConfiguration.accessTokenTtl,
        {
          email: user.email,
          username: user.username,
          role: user.role,
        }
      ),
      this.signToken(user.id, this.jwtConfiguration.refreshTokenTtl, {
        refreshTokenId,
      }),
    ]);

    await this.refreshTokenIdsStorage.insert(user.id, refreshTokenId);
    await this.redis.set(`accessToken:${user.id}`, accessToken, 'EX', this.jwtConfiguration.accessTokenTtl);
    await this.redis.del(`blacklist:${user.id}`);
    
    return {
      accessToken,
      refreshToken
    };
  }

  async refreshTokens(refreshTokenDto: RefreshTokenDto) {
    try {
      const { sub, refreshTokenId } = await this.jwtService.verifyAsync<
        Pick<ActiveUserData, 'sub'> & { refreshTokenId: string }
      >(refreshTokenDto.refreshToken, {
        secret: this.jwtConfiguration.secret,
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
      });

      const user = await this.usersRepository.findOneByOrFail({
        id: sub,
      });

      const isValid = await this.refreshTokenIdsStorage.validate(
        user.id,
        refreshTokenId,
      );

      if (isValid) {
        await this.refreshTokenIdsStorage.invalidate(user.id)
      } else {
        throw new Error('Refresh token is invalid');
      }

      return await this.generateTokens(user);
    } catch (error) {
      if (error instanceof InvalidatedRefreshTokenError) {
        throw new UnauthorizedException('Access Denied');
      }
      throw new UnauthorizedException(error.message);
    }
  }

  private async signToken<T>(userId: number, expiresIn: number, payload?: T) {
    return await this.jwtService.signAsync(
      {
        sub: userId,
        ...payload,
      } as ActiveUserData,
      {
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
        secret: this.jwtConfiguration.secret,
        expiresIn: this.jwtConfiguration.accessTokenTtl,
      }
    );
  }
}
