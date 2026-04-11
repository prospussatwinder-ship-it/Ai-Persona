import { Module } from "@nestjs/common";
import { AiUsageModule } from "../ai-usage/ai-usage.module";
import { MemoryModule } from "../memory/memory.module";
import { VoiceModule } from "../voice/voice.module";
import { MessagesController } from "./messages.controller";
import { MessagesService } from "./messages.service";

@Module({
  imports: [MemoryModule, VoiceModule, AiUsageModule],
  controllers: [MessagesController],
  providers: [MessagesService],
})
export class MessagesModule {}
