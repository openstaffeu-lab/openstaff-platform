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

export class CreateTaxRuleDto {
  @IsUUID('4')
  countryId!: string;

  @IsString()
  name!: string;

  @IsString()
  code!: string;

  @IsEnum(ProjectEngagementModel)
  appliesTo!: ProjectEngagementModel;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  vatRate!: number;

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

  @IsString()
  currencyCode!: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
