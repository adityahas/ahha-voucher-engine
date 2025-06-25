import { applyDecorators, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

export function UseAdminJwtGuard() {
  return applyDecorators(UseGuards(AuthGuard('jwt')));
}
