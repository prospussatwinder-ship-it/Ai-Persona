import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { Prisma, UserRole } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import type { AdminCreateUserDto } from "./dto/admin-create-user.dto";
import type { AdminUpdateUserDto } from "./dto/admin-update-user.dto";
import type { AdminUserQueryDto } from "./dto/admin-user-query.dto";

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  async list(q: AdminUserQueryDto) {
    const limit = Math.min(q.limit ?? 25, 100);
    const offset = q.offset ?? 0;
    const sortBy = q.sortBy ?? "createdAt";
    const sortDir = q.sortDir ?? "desc";

    const where: Prisma.UserWhereInput = { deletedAt: null };
    if (q.search?.trim()) {
      const s = q.search.trim();
      where.OR = [
        { email: { contains: s, mode: "insensitive" } },
        { displayName: { contains: s, mode: "insensitive" } },
        { firstName: { contains: s, mode: "insensitive" } },
        { lastName: { contains: s, mode: "insensitive" } },
      ];
    }
    if (q.role) where.role = q.role;
    if (q.status) where.status = q.status;
    if (q.subscriptionStatus) {
      where.userPlanSubscriptions = {
        some: { status: q.subscriptionStatus },
      };
    }

    const orderBy: Prisma.UserOrderByWithRelationInput =
      sortBy === "email"
        ? { email: sortDir }
        : sortBy === "displayName"
          ? { displayName: sortDir }
          : { createdAt: sortDir };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy,
        skip: offset,
        take: limit,
        select: {
          id: true,
          email: true,
          displayName: true,
          firstName: true,
          lastName: true,
          phone: true,
          avatarUrl: true,
          role: true,
          status: true,
          ageVerified: true,
          createdAt: true,
          lastLoginAt: true,
          userPlanSubscriptions: {
            take: 3,
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              status: true,
              plan: { select: { name: true, slug: true } },
            },
          },
        },
      }),
    ]);

    return { total, limit, offset, users: rows };
  }

  async getById(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: {
        userPlanSubscriptions: {
          orderBy: { createdAt: "desc" },
          include: { plan: true },
        },
      },
    });
    if (!user) throw new NotFoundException();
    return user;
  }

  async create(dto: AdminCreateUserDto, actorId: string) {
    const email = dto.email.toLowerCase();
    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists) throw new ConflictException("Email already in use");
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const displayName =
      [dto.firstName, dto.lastName].filter(Boolean).join(" ") || email.split("@")[0];
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        displayName,
        role: dto.role,
        createdBy: { connect: { id: actorId } },
        updatedBy: { connect: { id: actorId } },
      },
    });
    void this.audit.log({
      actorId,
      action: "user.create",
      entityType: "User",
      entityId: user.id,
      module: "users",
      description: `Created user ${user.email}`,
      newValues: { email: user.email, role: user.role },
    });
    return user;
  }

  async update(id: string, dto: AdminUpdateUserDto, actorId: string) {
    const existing = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new NotFoundException();

    if (dto.email && dto.email.toLowerCase() !== existing.email) {
      const clash = await this.prisma.user.findUnique({
        where: { email: dto.email.toLowerCase() },
      });
      if (clash) throw new ConflictException("Email already in use");
    }

    const data: Prisma.UserUpdateInput = {
      updatedBy: { connect: { id: actorId } },
    };
    if (dto.email) data.email = dto.email.toLowerCase();
    if (dto.firstName !== undefined) data.firstName = dto.firstName;
    if (dto.lastName !== undefined) data.lastName = dto.lastName;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.role !== undefined) data.role = dto.role;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.password) data.passwordHash = await bcrypt.hash(dto.password, 10);
    if (dto.firstName !== undefined || dto.lastName !== undefined) {
      const fn = dto.firstName ?? existing.firstName ?? "";
      const ln = dto.lastName ?? existing.lastName ?? "";
      const combined = [fn, ln].filter(Boolean).join(" ");
      if (combined) data.displayName = combined;
    }

    const user = await this.prisma.user.update({
      where: { id },
      data,
    });
    void this.audit.log({
      actorId,
      action: "user.update",
      entityType: "User",
      entityId: id,
      module: "users",
      oldValues: {
        email: existing.email,
        role: existing.role,
        status: existing.status,
      },
      newValues: {
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
    return user;
  }

  async patchStatus(id: string, status: import("@prisma/client").UserAccountStatus, actorId: string) {
    const existing = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new NotFoundException();
    const user = await this.prisma.user.update({
      where: { id },
      data: { status, updatedBy: { connect: { id: actorId } } },
    });
    void this.audit.log({
      actorId,
      action: "user.status",
      entityType: "User",
      entityId: id,
      module: "users",
      oldValues: { status: existing.status },
      newValues: { status: user.status },
    });
    return user;
  }

  async softDelete(id: string, actorId: string) {
    const existing = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new NotFoundException();
    if (existing.role === UserRole.SUPER_ADMIN) {
      throw new ConflictException("Cannot delete super admin");
    }
    await this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: "inactive",
        updatedBy: { connect: { id: actorId } },
      },
    });
    void this.audit.log({
      actorId,
      action: "user.soft_delete",
      entityType: "User",
      entityId: id,
      module: "users",
    });
    return { ok: true };
  }
}
