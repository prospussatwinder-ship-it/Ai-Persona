import { IsBoolean } from "class-validator";

export class PublishPersonaDto {
  @IsBoolean()
  isPublished!: boolean;
}
