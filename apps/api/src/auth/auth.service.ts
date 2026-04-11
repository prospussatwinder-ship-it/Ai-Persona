import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import { UserRepository } from "../repositories/user.repository";
import type { JwtAccessPayload } from "../common/types/jwt-payload.type";
import { UsersService } from "../users/users.service";
import type { RegisterDto } from "./dto/register.dto";
import type { LoginDto } from "./dto/login.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepo: UserRepository,
    private readonly users: UsersService,
    private readonly jwt: JwtService
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
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException("Invalid credentials");
    }
    return this.issueTokens(user.id, user.email, user.role);
  }

  me(userId: string) {
    return this.users.getProfile(userId);
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
