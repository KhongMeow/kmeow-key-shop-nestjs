import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService, ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import jwtConfig from 'src/identity/config/jwt.config';
import { Request } from 'express';
import { REQUEST_USER_KEY } from 'src/identity/identity.constanst';
import Redis from 'ioredis';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  private redis: Redis;

  constructor(
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY) private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
    private readonly configService: ConfigService,
  ) {
    this.redis = new Redis({
      host: configService.get('REDIS_HOST'),
      port: configService.get('REDIS_PORT'),
      password: configService.get('REDIS_PASS'),
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      const payload = await this.jwtService.verifyAsync(
        token,
        this.jwtConfiguration,
      );

      // Check accessTokenId in Redis
      const userId = payload.sub;
      const accessTokenId = payload.accessTokenId;
      const validAccessTokenId = await this.redis.get(`accessTokenId:${userId}`);
      if (!accessTokenId || accessTokenId !== validAccessTokenId) {
        throw new UnauthorizedException('Access token is invalidated');
      }

      request[REQUEST_USER_KEY] = payload;
    } catch (error) {
      throw new UnauthorizedException();
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [_, token] = request.headers.authorization?.split(' ') ?? [];
    return token;
  }
}
