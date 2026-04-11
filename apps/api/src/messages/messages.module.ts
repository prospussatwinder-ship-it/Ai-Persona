import { Module } from "@nestjs/common";
import { MemoryModule } from "../memory/memory.module";
import { VoiceModule } from "../voice/voice.module";
import { MessagesController } from "./messages.controller";
import { MessagesService } from "./messages.service";

@Module({
  imports: [MemoryModule, VoiceModule],
  controllers: [MessagesController],
  providers: [MessagesService],
})
export class MessagesModule {}
