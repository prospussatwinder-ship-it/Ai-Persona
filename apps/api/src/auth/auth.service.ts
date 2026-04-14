import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { createHash, randomBytes } from "crypto";
import { UserAccountStatus, UserRole } from "@prisma/client";
import { UserRepository } from "../repositories/user.repository";
import type { JwtAccessPayload } from "../common/types/jwt-payload.type";
import { UsersService } from "../users/users.service";
import type { RegisterDto } from "./dto/register.dto";
import type { LoginDto } from "./dto/login.dto";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { PermissionService } from "../rbac/permission.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepo: UserRepository,
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly permissions: PermissionService
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase();
    const exists = await this.usersRepo.findByEmail(email);
    if (exists) throw new ConflictException("Email already registered");
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersRepo.createUser({
      email,
      passwordHash,
      displayName: dto.displayName ?? email.split("@")[0],
      role: UserRole.CUSTOMER,
    });
    return this.issueTokens(user.id, user.email, user.role);
  }

  async login(dto: LoginDto) {
    const email = dto.email.toLowerCase();
    const user = await this.usersRepo.findByEmail(email);
    if (
      !user ||
      user.status !== UserAccountStatus.active ||
      !(await bcrypt.compare(dto.password, user.passwordHash))
    ) {
      throw new UnauthorizedException("Invalid credentials");
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    return this.issueTokens(user.id, user.email, user.role);
  }

  async forgotPassword(emailRaw: string, ip?: string, userAgent?: string) {
    const email = emailRaw.toLowerCase();
    const user = await this.usersRepo.findByEmail(email);
    if (!user) {
      return { ok: true };
    }
    const plain = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(plain).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await this.prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await this.prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });
    void this.audit.log({
      actorId: user.id,
      action: "auth.forgot_password",
      entityType: "User",
      entityId: user.id,
      module: "auth",
      ip,
      userAgent,
    });
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[dev] Password reset token for ${email} (expires ${expiresAt.toISOString()}): ${plain}`
      );
    }
    return { ok: true };
  }

  async resetPassword(token: string, newPassword: string) {
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const row = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });
    if (!row || row.expiresAt < new Date()) {
      throw new BadRequestException("Invalid or expired reset token");
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: row.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.delete({ where: { id: row.id } }),
    ]);
    void this.audit.log({
      actorId: row.userId,
      action: "auth.reset_password",
      entityType: "User",
      entityId: row.userId,
      module: "auth",
    });
    return { ok: true };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.usersRepo.findByIdWithPassword(userId);
    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw new UnauthorizedException("Current password is incorrect");
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
    void this.audit.log({
      actorId: userId,
      action: "auth.change_password",
      entityType: "User",
      entityId: userId,
      module: "auth",
    });
    return { ok: true };
  }

  async me(userId: string) {
    const profile = await this.users.getProfile(userId);
    let permissions: string[] = [];
    try {
      const set = await this.permissions.getSlugsForUserRole(profile.role);
      permissions = [...set];
    } catch {
      permissions = [];
    }
    return { ...profile, permissions };
  }

  private issueTokens(sub: string, email: string, role: UserRole) {
    const payload: JwtAccessPayload = { sub, email, role };
    const accessToken = this.jwt.sign(payload);
    return {
      accessToken,
      user: { id: sub, email, role },
    };
  }
}
