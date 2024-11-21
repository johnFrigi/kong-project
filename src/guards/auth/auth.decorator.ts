import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../jwt/jwt.guard';
import { RolesGuard } from '../roles/roles.guard';

export function Auth(...roles: string[]) {
  return applyDecorators(SetMetadata('roles', roles), UseGuards(JwtGuard, RolesGuard));
}
