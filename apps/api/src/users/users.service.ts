import { Injectable } from "@nestjs/common";
import { UserRepository } from "../repositories/user.repository";
import type { UpdateProfileDto } from "./dto/update-profile.dto";

@Injectable()
export class UsersService {
  constructor(private readonly users: UserRepository) {}

  getProfile(userId: string) {
    return this.users.findProfileById(userId);
  }

  updateProfile(userId: string, dto: UpdateProfileDto) {
    const hasAny =
      dto.displayName !== undefined ||
      dto.firstName !== undefined ||
      dto.lastName !== undefined ||
      dto.phone !== undefined ||
      dto.avatarUrl !== undefined;
    if (!hasAny) {
      return this.users.findProfileById(userId);
    }
    return this.users.updateProfile(userId, {
      displayName: dto.displayName,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      avatarUrl: dto.avatarUrl,
    });
  }
}
