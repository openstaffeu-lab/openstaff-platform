import { ProjectDocumentType } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

function toBoolean(value: unknown) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }

  return false;
}

export class UploadProjectDocumentDto {
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

  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsUUID()
  jobRequestId?: string;
}
