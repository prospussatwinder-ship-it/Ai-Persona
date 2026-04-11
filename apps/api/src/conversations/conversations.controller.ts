import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import type { Request } from "express";
import { CreateConversationDto } from "./dto/create-conversation.dto";
import { ConversationsService } from "./conversations.service";

type Authed = Request & { user: { sub: string } };

@Controller("conversations")
@UseGuards(AuthGuard("jwt"))
export class ConversationsController {
  constructor(private readonly conversations: ConversationsService) {}

  @Post()
  create(@Req() req: Authed, @Body() body: CreateConversationDto) {
    return this.conversations.create(req.user.sub, body);
  }

  @Get()
  async list(@Req() req: Authed) {
    const conversations = await this.conversations.list(req.user.sub);
    return { conversations };
  }

  @Get(":id")
  getOne(@Req() req: Authed, @Param("id") id: string) {
    return this.conversations.getOne(req.user.sub, id);
  }
}
