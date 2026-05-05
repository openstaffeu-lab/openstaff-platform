import { ProjectDocumentType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateProjectDocumentDto {
  @IsOptional()
  @IsEnum(ProjectDocumentType)
  type?: ProjectDocumentType;

  @IsString()
  @MinLength(2)
  @MaxLength(160)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  fileName!: string;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sizeBytes?: number;

  @IsOptional()
  @IsString()
  storageProvider?: string;

  @IsOptional()
  @IsString()
  storageBucket?: string;

  @IsOptional()
  @IsString()
  storageKey?: string;

  @IsOptional()
  @IsString()
  checksumSha256?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsUUID()
  jobRequestId?: string;
}
