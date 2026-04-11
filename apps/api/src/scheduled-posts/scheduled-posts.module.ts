import { Module } from "@nestjs/common";
import { ScheduledPostsController } from "./scheduled-posts.controller";
import { ScheduledPostsService } from "./scheduled-posts.service";

@Module({
  controllers: [ScheduledPostsController],
  providers: [ScheduledPostsService],
})
export class ScheduledPostsModule {}
