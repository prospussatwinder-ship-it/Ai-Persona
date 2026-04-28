import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

class UploadedMediaDto {
  @IsString()
  @IsIn(["image", "video"])
  kind!: "image" | "video";

  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  url!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  fileName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  mimeType?: string;
}

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

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(6)
  @ValidateNested({ each: true })
  @Type(() => UploadedMediaDto)
  uploadedMedia?: UploadedMediaDto[];
}
