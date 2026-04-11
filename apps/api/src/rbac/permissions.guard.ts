import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { UserRole } from "@prisma/client";
import { PermissionService } from "./permission.service";
import { PERMISSIONS_KEY } from "./require-permissions.decorator";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissions: PermissionService
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required?.length) return true;
    const req = ctx.switchToHttp().getRequest<{ user?: { role?: UserRole } }>();
    const role = req.user?.role;
    if (!role) throw new ForbiddenException();
    for (const slug of required) {
      if (!(await this.permissions.userHasPermission(role, slug))) {
        throw new ForbiddenException("Missing permission: " + slug);
      }
    }
    return true;
  }
}
