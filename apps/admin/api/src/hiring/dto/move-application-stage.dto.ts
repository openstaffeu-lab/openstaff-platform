import { ApplicationStage } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class MoveApplicationStageDto {
  @IsEnum(ApplicationStage)
  targetStage!: ApplicationStage;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
