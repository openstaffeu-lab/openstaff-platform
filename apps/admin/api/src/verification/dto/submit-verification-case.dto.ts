import {
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class SubmitVerificationCaseDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  profileDocumentIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  actorDocumentIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  actorCertificationIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  medicalFitnessCertificateIds?: string[];
}
