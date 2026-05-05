import { Type } from 'class-transformer';
import { ProjectEngagementModel } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class UpdateTaxRuleDto {
  @IsOptional()
  @IsUUID('4')
  countryId?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsEnum(ProjectEngagementModel)
  appliesTo?: ProjectEngagementModel;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  vatRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  withholdingRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  socialContributionRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  employerContributionRate?: number;

  @IsOptional()
  @IsString()
  currencyCode?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
