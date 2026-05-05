import { ProfileDocumentType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UploadProfileDocumentDto {
  @IsOptional()
  @IsEnum(ProfileDocumentType)
  type?: ProfileDocumentType;

  @IsString()
  @MaxLength(160)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  useForMatching?: boolean;
}
