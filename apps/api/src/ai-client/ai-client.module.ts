import { Global, Module } from "@nestjs/common";
import { AiClientService } from "./ai-client.service";
import { AiProviderRegistry } from "./providers/ai-provider.registry";
import { LocalAiProvider } from "./providers/local-ai.provider";

@Global()
@Module({
  providers: [AiClientService, LocalAiProvider, AiProviderRegistry],
  exports: [AiClientService],
})
export class AiClientModule {}
