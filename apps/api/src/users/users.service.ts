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
    if (dto.displayName === undefined) {
      return this.users.findProfileById(userId);
    }
    return this.users.updateProfile(userId, { displayName: dto.displayName });
  }
}
