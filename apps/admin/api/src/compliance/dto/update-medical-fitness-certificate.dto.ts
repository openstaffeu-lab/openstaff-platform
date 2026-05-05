import {
  ComplianceDocumentStatus,
  MedicalFitnessCategory,
  MedicalFitnessDecision,
} from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class UpdateMedicalFitnessCertificateDto {
  @IsOptional()
  @IsUUID('4')
  actorDocumentId?: string;

  @IsOptional()
  @IsEnum(MedicalFitnessCategory)
  category?: MedicalFitnessCategory;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  issuerName?: string;

  @IsOptional()
  @IsUUID('4')
  issuedByProfileId?: string;

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
  @IsEnum(MedicalFitnessDecision)
  fitnessDecision?: MedicalFitnessDecision;

  @IsOptional()
  @IsString()
  jobSpecificClearance?: string;
}
