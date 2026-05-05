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

export class CreateProjectJobRequestDto {
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  scopeOfWork?: string;

  @IsOptional()
  @IsEnum(ProjectJobRequestStatus)
  status?: ProjectJobRequestStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  workerCount?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  budgetMinCents?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  budgetMaxCents?: number;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{3}$/)
  currencyCode?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  requiredExperienceYears?: number;

  @IsOptional()
  @IsBoolean()
  requiresCertification?: boolean;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsDateString()
  responseDeadline?: string;

  @IsOptional()
  @IsUUID()
  languageId?: string;

  @IsOptional()
  @IsString()
  notes?: string;

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
