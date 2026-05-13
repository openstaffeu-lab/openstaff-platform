import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { OnboardingStatus } from '@prisma/client';

export class UpdateOnboardingStepDto {
  @IsOptional()
  @IsString()
  currentStep?: string;

  @IsOptional()
  @IsString()
  completedStep?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  completedSteps?: string[];

  @IsOptional()
  @IsEnum(OnboardingStatus)
  status?: OnboardingStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  completionPercent?: number;
}
