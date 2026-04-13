import { IsObject, IsOptional, IsString, MaxLength } from "class-validator";

export class UpsertPersonaTrainingDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8000)
  trainingNotes?: string;

  @IsOptional()
  @IsObject()
  structuredProfile?: Record<string, unknown>;
}
