import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { UserRole } from "@prisma/client";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import { CreateScheduledPostDto } from "./dto/create-scheduled-post.dto";
import { ScheduledPostsService } from "./scheduled-posts.service";

@Controller("admin/scheduled-posts")
@UseGuards(AuthGuard("jwt"), RolesGuard)
@Roles(UserRole.ADMIN, UserRole.OPERATOR)
export class ScheduledPostsController {
  constructor(private readonly scheduledPosts: ScheduledPostsService) {}

  @Get()
  list(@Query("personaId") personaId?: string) {
    return this.scheduledPosts.list(personaId);
  }

  @Post()
  create(@Body() body: CreateScheduledPostDto) {
    return this.scheduledPosts.create(body);
  }

  @Patch(":id/publish")
  publish(@Param("id") id: string) {
    return this.scheduledPosts.markPublished(id);
  }
}
