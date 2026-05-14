import { CompensationType } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateCompensationAgreementDto {
  @IsUUID()
  workforceAssignmentId!: string;

  @IsEnum(CompensationType)
  compensationType!: CompensationType;

  @IsString()
  currency!: string;

  @IsNumber()
  @Min(0)
  baseRate!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  overtimeRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  overtimeThresholdHours?: number;

  @IsDateString()
  effectiveFrom!: string;

  @IsOptional()
  @IsDateString()
  effectiveTo?: string;
}
