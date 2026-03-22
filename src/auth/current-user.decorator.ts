import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { UserRole } from './auth.types';

export const CurrentUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ auth?: { userId: string; role: UserRole } }>();
    return request.auth?.userId;
  },
);

export const CurrentUserRole = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserRole | undefined => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ auth?: { userId: string; role: UserRole } }>();
    return request.auth?.role;
  },
);
