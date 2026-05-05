import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

class ApplyProjectAITaxonomyDto {
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  escoIds?: string[];

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  naceIds?: string[];

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  uniclassIds?: string[];
}

export class ApplyProjectAIInterpretationDto {
  @IsOptional()
  @IsBoolean()
  applySummary?: boolean;

  @IsOptional()
  @IsBoolean()
  applyEngagementModel?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(0, { each: true })
  jobRequestIndexes?: number[];

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(0, { each: true })
  conditionIndexes?: number[];

  @IsOptional()
  @ValidateNested()
  @Type(() => ApplyProjectAITaxonomyDto)
  taxonomy?: ApplyProjectAITaxonomyDto;
}
