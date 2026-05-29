import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsEnum,
} from 'class-validator';
import { ReluProcessingDomain } from '@prisma/client';

export class TaxonomySuggestionDto {
  @IsString()
  query!: string;

  @IsOptional()
  @IsNumber()
  limit?: number;
}

export class EscoSuggestionDto {
  @IsString()
  query!: string;

  @IsOptional()
  @IsNumber()
  limit?: number;
}

export class NaceSuggestionDto {
  @IsString()
  query!: string;

  @IsOptional()
  @IsNumber()
  limit?: number;
}

export class UniclassSuggestionDto {
  @IsString()
  query!: string;

  @IsOptional()
  @IsNumber()
  limit?: number;
}

export class IntentClassificationDto {
  @IsString()
  text!: string;
}

export class SummaryGenerationDto {
  @IsString()
  text!: string;
}

export class GeographySuggestionDto {
  @IsString()
  query!: string;

  @IsOptional()
  @IsNumber()
  limit?: number;
}
