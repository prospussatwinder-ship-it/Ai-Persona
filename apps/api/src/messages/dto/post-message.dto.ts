import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class PostMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(16000)
  content!: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  replyToMessageId?: string;
}
