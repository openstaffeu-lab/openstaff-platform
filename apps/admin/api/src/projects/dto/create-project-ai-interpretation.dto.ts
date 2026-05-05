import { ProjectAIInterpretationStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateProjectAIInterpretationDto {
  @IsOptional()
  @IsEnum(ProjectAIInterpretationStatus)
  status?: ProjectAIInterpretationStatus;

  @IsOptional()
  @IsString()
  sourceText?: string;

  @IsOptional()
  @IsObject()
  extractedJson?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  extractedJsonText?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  documentIds?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  confidenceScore?: number;

  @IsOptional()
  @IsString()
  modelName?: string;

  @IsOptional()
  @IsString()
  modelVersion?: string;

  @IsOptional()
  @IsString()
  promptVersion?: string;

  @IsOptional()
  @IsString()
  reviewNotes?: string;
}
