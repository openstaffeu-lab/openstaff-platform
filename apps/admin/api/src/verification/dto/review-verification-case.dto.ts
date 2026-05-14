import { VerificationDecisionType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewVerificationCaseDto {
  @IsEnum(VerificationDecisionType)
  decision!: VerificationDecisionType;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
