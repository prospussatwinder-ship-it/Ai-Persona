import { PersonaAccessType, UserPersonaAccessStatus } from "@prisma/client";
import {
  IsDateString,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class GrantPersonaAccessDto {
  @IsString()
  @MaxLength(64)
  userId!: string;

  @IsEnum(PersonaAccessType)
  accessType!: PersonaAccessType;

  @IsOptional()
  @IsEnum(UserPersonaAccessStatus)
  status?: UserPersonaAccessStatus;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
