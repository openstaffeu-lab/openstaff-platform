import { ActorDocumentType, ComplianceDocumentStatus } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class UpdateActorDocumentDto {
  @IsOptional()
  @IsUUID('4')
  profileDocumentId?: string;

  @IsOptional()
  @IsEnum(ActorDocumentType)
  type?: ActorDocumentType;

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

  @IsOptional()
  @IsString()
  notes?: string;
}
