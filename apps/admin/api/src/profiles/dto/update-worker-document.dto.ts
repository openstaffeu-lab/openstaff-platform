import {
  ComplianceDocumentStatus,
  MedicalFitnessCategory,
  WorkerDocumentType,
} from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateWorkerDocumentDto {
  @IsOptional()
  @IsEnum(WorkerDocumentType)
  type?: WorkerDocumentType;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  issuer?: string | null;

  @IsOptional()
  @IsString()
  issuedAt?: string | null;

  @IsOptional()
  @IsString()
  expiresAt?: string | null;

  @IsOptional()
  @IsEnum(ComplianceDocumentStatus)
  status?: ComplianceDocumentStatus;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  fileName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  mimeType?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sizeBytes?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  storageProvider?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  storageKey?: string | null;

  @IsOptional()
  @IsEnum(MedicalFitnessCategory)
  medicalCategory?: MedicalFitnessCategory | null;
}
