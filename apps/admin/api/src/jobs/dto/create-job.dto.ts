import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { JobCategory } from '@prisma/client';

export class CreateJobDto {
  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsEnum(JobCategory)
  category!: JobCategory;

  @IsOptional()
  @IsString()
  naceCode?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  escoRequired?: string[];

  @IsOptional()
  @IsString()
  uniclassCode?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  regionCode?: string;

  @IsOptional()
  @IsString()
  countryCode?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== undefined && value !== null)
  budget?: number;

  @IsOptional()
  startDate?: string;

  @IsOptional()
  endDate?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mediaUrls?: string[];
}
