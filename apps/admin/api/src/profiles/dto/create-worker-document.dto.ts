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

export class CreateWorkerDocumentDto {
  @IsEnum(WorkerDocumentType)
  type!: WorkerDocumentType;

  @IsString()
  @MaxLength(160)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  issuer?: string;

  @IsOptional()
  @IsString()
  issuedAt?: string;

  @IsOptional()
  @IsString()
  expiresAt?: string;

  @IsOptional()
  @IsEnum(ComplianceDocumentStatus)
  status?: ComplianceDocumentStatus;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  fileName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  mimeType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sizeBytes?: number;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  storageProvider?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  storageKey?: string;

  @IsOptional()
  @IsEnum(MedicalFitnessCategory)
  medicalCategory?: MedicalFitnessCategory;
}
