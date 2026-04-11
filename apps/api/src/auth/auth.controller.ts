import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import type { Request } from "express";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

type Authed = Request & { user: { sub: string; email: string; role: string } };

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("register")
  async register(@Body() body: RegisterDto) {
    const res = await this.auth.register(body);
    return { ...res, token: res.accessToken };
  }

  @Post("login")
  async login(@Body() body: LoginDto) {
    const res = await this.auth.login(body);
    return { ...res, token: res.accessToken };
  }

  @UseGuards(AuthGuard("jwt"))
  @Get("me")
  me(@Req() req: Authed) {
    return this.auth.me(req.user.sub);
  }
}
