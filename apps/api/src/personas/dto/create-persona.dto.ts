import {
  IsArray,
  ArrayMaxSize,
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";
import { PersonaVisibility } from "@prisma/client";

export class CreatePersonaDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  slug!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsEnum(PersonaVisibility)
  visibility?: PersonaVisibility;

  @IsOptional()
  @IsString()
  tagline?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  systemPrompt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  scopeName?: string;

  @IsOptional()
  @IsString()
  scopeDescription?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  allowedTopics?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  blockedTopics?: string[];

  @IsOptional()
  @IsString()
  behaviorRules?: string;

  @IsOptional()
  @IsObject()
  feedData?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  avatarUrl?: string;
}
