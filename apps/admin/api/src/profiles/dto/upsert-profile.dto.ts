import {
  ProfileAvailabilityStatus,
  ProfileLifecycleStatus,
  ProfileType,
  ProfileVisibility,
} from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

class ContractorProfileDetailsDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  tradeFocus?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  teamSize?: number;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  serviceArea?: string;
}

class ProfessionalProfileDetailsDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  headline?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(60)
  yearsExperience?: number;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  portfolioFocus?: string;
}

export class UpsertProfileDto {
  @IsOptional()
  @IsEnum(ProfileType)
  profileType?: ProfileType;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  slug?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(160)
  displayName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  companyName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  publicHeadline?: string | null;

  @IsOptional()
  @IsString()
  summary?: string | null;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  websiteUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  publicEmail?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  publicPhone?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  privateEmail?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  privatePhone?: string | null;

  @IsOptional()
  @IsString()
  privateNotes?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  companyRegistrationNumber?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  taxNumber?: string | null;

  @IsOptional()
  @IsEnum(ProfileVisibility)
  visibility?: ProfileVisibility;

  @IsOptional()
  @IsEnum(ProfileLifecycleStatus)
  status?: ProfileLifecycleStatus;

  @IsOptional()
  @IsString()
  countryId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  countryCode?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  countryName?: string | null;

  @IsOptional()
  @IsString()
  regionId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  regionName?: string | null;

  @IsOptional()
  @IsString()
  cityId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  cityName?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsIn(['B2B', 'B2C', 'MIXED'], { each: true })
  supportedEngagementModels?: Array<'B2B' | 'B2C' | 'MIXED'>;

  @IsOptional()
  @IsString()
  certificationsText?: string | null;

  @IsOptional()
  @IsEnum(ProfileAvailabilityStatus)
  availabilityStatus?: ProfileAvailabilityStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number | null;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  languageIds?: string[];

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  languageCodes?: string[];

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  escoSkillIds?: string[];

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  escoCodes?: string[];

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  naceIds?: string[];

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  naceCodes?: string[];

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  uniclassIds?: string[];

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  uniclassCodes?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => ContractorProfileDetailsDto)
  contractorProfile?: ContractorProfileDetailsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ProfessionalProfileDetailsDto)
  professionalProfile?: ProfessionalProfileDetailsDto;
}
