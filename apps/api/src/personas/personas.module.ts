import { Module } from "@nestjs/common";
import { MemoryModule } from "../memory/memory.module";
import { PersonasController } from "./personas.controller";
import { PersonaContextService } from "./persona-context.service";
import { PersonasService } from "./personas.service";

@Module({
  imports: [MemoryModule],
  controllers: [PersonasController],
  providers: [PersonasService, PersonaContextService],
  exports: [PersonasService, PersonaContextService],
})
export class PersonasModule {}
