import { Module } from "@nestjs/common";
import { AiUsageModule } from "../ai-usage/ai-usage.module";
import { MediaModule } from "../media/media.module";
import { MemoryModule } from "../memory/memory.module";
import { PersonasModule } from "../personas/personas.module";
import { VoiceModule } from "../voice/voice.module";
import { MessagesController } from "./messages.controller";
import { MessagesService } from "./messages.service";

@Module({
  imports: [MemoryModule, VoiceModule, AiUsageModule, PersonasModule, MediaModule],
  controllers: [MessagesController],
  providers: [MessagesService],
})
export class MessagesModule {}
