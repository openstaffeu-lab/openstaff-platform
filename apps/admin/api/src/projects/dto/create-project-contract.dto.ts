import { Type } from 'class-transformer';
import { ProjectEngagementModel } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProjectContractDto {
  @IsOptional()
  @IsEnum(ProjectEngagementModel)
  contractType?: ProjectEngagementModel;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  scopeSummary?: string;

  @IsOptional()
  @IsString()
  commercialTerms?: string;

  @IsOptional()
  @IsString()
  paymentTerms?: string;

  @IsOptional()
  @IsString()
  safetyTerms?: string;

  @IsOptional()
  @IsString()
  insuranceTerms?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}
