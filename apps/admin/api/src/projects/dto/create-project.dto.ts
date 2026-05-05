import {
  ProjectAIInterpretationStatus,
  ProjectConditionType,
  ProjectDocumentType,
  ProjectEngagementModel,
  ProjectJobRequestStatus,
  ProjectStatus,
  ProjectVisibility,
} from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CreateProjectConditionInputDto {
  @IsOptional()
  @IsEnum(ProjectConditionType)
  type?: ProjectConditionType;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  clauseKey?: string;

  @IsString()
  @MinLength(2)
  content!: string;

  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class CreateProjectDocumentInputDto {
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
}

export class CreateProjectAIInterpretationInputDto {
  @IsOptional()
  @IsEnum(ProjectAIInterpretationStatus)
  status?: ProjectAIInterpretationStatus;

  @IsOptional()
  @IsString()
  sourceText?: string;

  @IsOptional()
  @IsObject()
  extractedJson?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  extractedJsonText?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  confidenceScore?: number;

  @IsOptional()
  @IsString()
  modelName?: string;

  @IsOptional()
  @IsString()
  modelVersion?: string;

  @IsOptional()
  @IsString()
  promptVersion?: string;

  @IsOptional()
  @IsString()
  reviewNotes?: string;
}

export class CreateProjectJobRequestInputDto {
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

export class CreateProjectDto {
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(180)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  summary?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  scopeOfWork?: string;

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
  location?: string;

  @IsOptional()
  @IsString()
  addressLine1?: string;

  @IsOptional()
  @IsString()
  addressLine2?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  longitude?: number;

  @IsOptional()
  @IsUUID()
  countryId?: string;

  @IsOptional()
  @IsUUID()
  regionId?: string;

  @IsOptional()
  @IsUUID()
  cityId?: string;

  @IsOptional()
  @IsUUID()
  primaryLanguageId?: string;

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
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsDateString()
  responseDeadline?: string;

  @IsOptional()
  @IsDateString()
  publishedAt?: string;

  @IsOptional()
  @IsDateString()
  archivedAt?: string;

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

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProjectJobRequestInputDto)
  jobRequests?: CreateProjectJobRequestInputDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProjectConditionInputDto)
  conditions?: CreateProjectConditionInputDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProjectDocumentInputDto)
  documents?: CreateProjectDocumentInputDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateProjectAIInterpretationInputDto)
  aiInterpretation?: CreateProjectAIInterpretationInputDto;
}
