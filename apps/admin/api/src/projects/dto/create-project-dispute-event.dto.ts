import { ProjectDisputeEventType } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateProjectDisputeEventDto {
  @IsEnum(ProjectDisputeEventType)
  type!: ProjectDisputeEventType;

  @IsString()
  message!: string;

  @IsOptional()
  metadataJson?: Record<string, unknown> | string;
}
