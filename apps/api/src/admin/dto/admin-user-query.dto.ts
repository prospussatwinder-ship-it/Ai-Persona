import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { Type } from "class-transformer";
import { UserAccountStatus, UserRole } from "@prisma/client";
import { AccountSubscriptionStatus } from "@prisma/client";

export class AdminUserQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(UserAccountStatus)
  status?: UserAccountStatus;

  @IsOptional()
  @IsEnum(AccountSubscriptionStatus)
  subscriptionStatus?: AccountSubscriptionStatus;

  @IsOptional()
  @IsString()
  sortBy?: "createdAt" | "email" | "displayName";

  @IsOptional()
  @IsString()
  sortDir?: "asc" | "desc";

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}
