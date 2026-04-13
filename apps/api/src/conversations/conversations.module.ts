import { Module } from "@nestjs/common";
import { PersonasModule } from "../personas/personas.module";
import { ConversationsController } from "./conversations.controller";
import { ConversationsService } from "./conversations.service";

@Module({
  imports: [PersonasModule],
  controllers: [ConversationsController],
  providers: [ConversationsService],
})
export class ConversationsModule {}