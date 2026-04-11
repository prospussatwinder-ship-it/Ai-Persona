import { Body, Controller, Get, Patch, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import type { Request } from "express";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { UsersService } from "./users.service";

type Authed = Request & { user: { sub: string } };

@Controller("users")
@UseGuards(AuthGuard("jwt"))
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get("me")
  me(@Req() req: Authed) {
    return this.users.getProfile(req.user.sub);
  }

  @Patch("me")
  patchMe(@Req() req: Authed, @Body() body: UpdateProfileDto) {
    return this.users.updateProfile(req.user.sub, body);
  }
}
