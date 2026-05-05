import { ProjectJobRequestStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateProjectJobRequestDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  scopeOfWork?: string | null;

  @IsOptional()
  @IsEnum(ProjectJobRequestStatus)
  status?: ProjectJobRequestStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  workerCount?: number | null;

  @IsOptional()
  @IsString()
  unit?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  budgetMinCents?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  budgetMaxCents?: number | null;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{3}$/)
  currencyCode?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  requiredExperienceYears?: number | null;

  @IsOptional()
  @IsBoolean()
  requiresCertification?: boolean;

  @IsOptional()
  @IsDateString()
  startDate?: string | null;

  @IsOptional()
  @IsDateString()
  endDate?: string | null;

  @IsOptional()
  @IsDateString()
  responseDeadline?: string | null;

  @IsOptional()
  @IsUUID()
  languageId?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  escoSkillIds?: string[];

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  naceIds?: string[];

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  uniclassIds?: string[];
}
