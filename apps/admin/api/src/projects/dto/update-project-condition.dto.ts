import { ProjectConditionScope, ProjectConditionType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateProjectConditionDto {
  @IsOptional()
  @IsEnum(ProjectConditionType)
  type?: ProjectConditionType;

  @IsOptional()
  @IsEnum(ProjectConditionScope)
  scope?: ProjectConditionScope;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  clauseKey?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(2)
  content?: string;

  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsUUID()
  jobRequestId?: string | null;
}
