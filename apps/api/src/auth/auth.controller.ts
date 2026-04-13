import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import type { Request } from "express";
import { AuthService } from "./auth.service";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";

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

  @Post("forgot-password")
  async forgotPassword(@Body() body: ForgotPasswordDto, @Req() req: Request) {
    const ip = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim();
    const userAgent = req.headers["user-agent"] as string | undefined;
    return this.auth.forgotPassword(body.email, ip, userAgent);
  }

  @Post("reset-password")
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.auth.resetPassword(body.token, body.password);
  }

  @UseGuards(AuthGuard("jwt"))
  @Post("change-password")
  async changePassword(@Req() req: Authed, @Body() body: ChangePasswordDto) {
    return this.auth.changePassword(req.user.sub, body.currentPassword, body.newPassword);
  }

  @HttpCode(204)
  @Post("logout")
  logout() {
    return;
  }

  @UseGuards(AuthGuard("jwt"))
  @Get("me")
  me(@Req() req: Authed) {
    return this.auth.me(req.user.sub);
  }
}
