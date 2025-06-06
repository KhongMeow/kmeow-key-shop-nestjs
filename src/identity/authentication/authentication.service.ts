import { BadRequestException, Inject, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { SignUpDto } from './dto/sign-up.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
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
import { BalancesService } from 'src/balances/balances.service';

@Injectable()
export class AuthenticationService {
  private redis: Redis;

  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    private readonly usersService: UsersService,
    private readonly hashingService: HashingService,
    private readonly rolesService: RolesService,
    private readonly balancesService: BalancesService,
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

  async sendVerificationEmail(sendVerifyEmailDto: SendVerifyEmailDto): Promise<{ status: number, message: string }> {
    try {
      const { email } = sendVerifyEmailDto;
      let verificationCode = await this.redis.get(`verificationCode:${email}`);

      if (!verificationCode) {
        verificationCode = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a new 6-digit code
        await this.redis.set(`verificationCode:${email}`, verificationCode, 'EX', 180); // Store the code in Redis with 3mn expiration
      }

      await this.mailsService.sendMail(email, 'Email Verification', `Your verification code is: ${verificationCode}`);
      
      return {
        status: 200,
        message: 'Verification email sent successfully'
      }
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

      return {
        status: 200,
        message: 'Email verified successfully'
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async signUp(signUpDto: SignUpDto) {
    try {
      const defaultRole = await this.rolesService.findOne('user');
      if (!defaultRole) {
        throw new Error('Default role not found');
      }
      await this.usersService.isExistUsernameOrEmail(signUpDto.username, signUpDto.email);

      const user = new User();
      user.fullname = signUpDto.fullname;
      user.username = signUpDto.username;
      user.email = signUpDto.email;
      user.password = await this.hashingService.hash(signUpDto.password);
      user.role = defaultRole;

      await this.usersRepository.save(user);
      await this.balancesService.create(user);

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
        relations: ['role', 'balance'],
      });

      if (!user) {
        throw new NotFoundException(`Incorrect username or email!`);
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

  async signOut(username: string) {
    try {
      const user = await this.usersService.findOne(username);

      const isTokenValid = await this.refreshTokenIdsStorage.isTokenValid(user.id);

      if (isTokenValid) {
        await Promise.all([
          this.refreshTokenIdsStorage.invalidate(user.id),
          this.redis.del(`accessTokenId:${user.id}`),
        ]);

        return { 
          status: 200,
          message: 'User signed out'
        };
      } else {
        throw new BadRequestException('User is not signed in');
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  private async generateTokens(user: User) {
    const refreshTokenId = randomUUID();
    const accessTokenId = randomUUID();

    const [accessToken, refreshToken] = await Promise.all([
      this.signToken<Partial<ActiveUserData>>(
        user.id,
        this.jwtConfiguration.accessTokenTtl,
        {
          accessTokenId,
          email: user.email,
          username: user.username,
          role: user.role,
        }
      ),
      this.signToken(user.id, this.jwtConfiguration.refreshTokenTtl, {
        refreshTokenId,
      }),
    ]);

    await Promise.all([
      this.refreshTokenIdsStorage.insert(user.id, refreshTokenId),
      this.redis.set(`accessTokenId:${user.id}`, accessTokenId, 'EX', this.jwtConfiguration.accessTokenTtl),
    ]);
    
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

      const user = await this.usersRepository.findOneOrFail({
        where: { id: sub },
        relations: ['role'],
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
        expiresIn,
      }
    );
  }
}
