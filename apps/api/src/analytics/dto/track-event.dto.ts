import { IsObject, IsOptional, IsString } from "class-validator";

export class TrackEventDto {
  @IsString()
  type!: string;

  @IsOptional()
  @IsString()
  personaId?: string;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}
