import {
  ProjectEngagementModel,
  ProjectStatus,
  ProjectVisibility,
} from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(180)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  summary?: string | null;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  scopeOfWork?: string | null;

  @IsOptional()
  @IsEnum(ProjectEngagementModel)
  engagementModel?: ProjectEngagementModel;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsEnum(ProjectVisibility)
  visibility?: ProjectVisibility;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  location?: string | null;

  @IsOptional()
  @IsString()
  addressLine1?: string | null;

  @IsOptional()
  @IsString()
  addressLine2?: string | null;

  @IsOptional()
  @IsString()
  postalCode?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  latitude?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  longitude?: number | null;

  @IsOptional()
  @IsUUID()
  countryId?: string | null;

  @IsOptional()
  @IsUUID()
  regionId?: string | null;

  @IsOptional()
  @IsUUID()
  cityId?: string | null;

  @IsOptional()
  @IsUUID()
  primaryLanguageId?: string | null;

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
  @IsDateString()
  startDate?: string | null;

  @IsOptional()
  @IsDateString()
  endDate?: string | null;

  @IsOptional()
  @IsDateString()
  responseDeadline?: string | null;

  @IsOptional()
  @IsDateString()
  publishedAt?: string | null;

  @IsOptional()
  @IsDateString()
  archivedAt?: string | null;

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
