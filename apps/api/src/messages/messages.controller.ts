import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import type { Request } from "express";
import { PostMessageDto } from "./dto/post-message.dto";
import { MessagesService } from "./messages.service";

type Authed = Request & { user: { sub: string } };

@Controller("conversations/:conversationId/messages")
@UseGuards(AuthGuard("jwt"))
export class MessagesController {
  constructor(private readonly messages: MessagesService) {}

  @Get()
  list(@Req() req: Authed, @Param("conversationId") conversationId: string) {
    return this.messages.listMessages(req.user.sub, conversationId);
  }

  @Post()
  append(
    @Req() req: Authed,
    @Param("conversationId") conversationId: string,
    @Body() body: PostMessageDto
  ) {
    const ip = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim();
    return this.messages.appendMessage(req.user.sub, conversationId, body, ip);
  }
}
