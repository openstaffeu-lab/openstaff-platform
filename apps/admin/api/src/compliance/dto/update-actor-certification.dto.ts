import { ActorCertificationType, ComplianceDocumentStatus } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class UpdateActorCertificationDto {
  @IsOptional()
  @IsUUID('4')
  actorDocumentId?: string;

  @IsOptional()
  @IsUUID('4')
  escoSkillId?: string;

  @IsOptional()
  @IsEnum(ActorCertificationType)
  type?: ActorCertificationType;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
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
}
