import { Module } from "@nestjs/common";
import { MockVoiceAdapter } from "./mock-voice.adapter";
import { VoiceService } from "./voice.service";

@Module({
  providers: [MockVoiceAdapter, VoiceService],
  exports: [VoiceService],
})
export class VoiceModule {}
