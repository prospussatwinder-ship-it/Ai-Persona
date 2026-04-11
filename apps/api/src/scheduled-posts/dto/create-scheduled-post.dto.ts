import { IsISO8601, IsOptional, IsString, MinLength } from "class-validator";

export class CreateScheduledPostDto {
  @IsString()
  personaId!: string;

  @IsString()
  @MinLength(1)
  body!: string;

  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @IsISO8601()
  scheduledFor!: string;
}
