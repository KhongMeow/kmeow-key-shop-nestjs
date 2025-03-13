import { CanActivate, ExecutionContext, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { RolesService } from 'src/roles/roles.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    private readonly rolesService: RolesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.get<string[]>('permissions', context.getHandler());
    if (!requiredPermissions) {
      return true;
    }
    
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('Token not provided');
    }

    const user = this.jwtService.decode(token);
    if (!user) {
      throw new ForbiddenException('Invalid token');
    }

    const roleId = user.role.id;
    const role = await this.rolesService.getPermissionsInRole(roleId);

    if (!role.rolePermissions) {
      throw new ForbiddenException('You do not have any permission');
    }

    const userPermissions = role?.rolePermissions.map(
      (rolePermission) => rolePermission.permission.slug,
    );

    const hasPermission = requiredPermissions.some((permission) => 
      userPermissions?.includes(permission),
    );
    if (!hasPermission) {
      throw new ForbiddenException('You do not have permission to access this resource');
    }
    
    return true;
  }
}
