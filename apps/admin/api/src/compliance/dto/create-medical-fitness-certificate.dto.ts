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

export class CreateMedicalFitnessCertificateDto {
  @IsOptional()
  @IsUUID('4')
  actorDocumentId?: string;

  @IsEnum(MedicalFitnessCategory)
  category!: MedicalFitnessCategory;

  @IsString()
  @MaxLength(255)
  title!: string;

  @IsString()
  @MaxLength(255)
  issuerName!: string;

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
