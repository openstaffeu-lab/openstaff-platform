import { ProjectDisputeStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateProjectDisputeStatusDto {
  @IsEnum(ProjectDisputeStatus)
  status!: ProjectDisputeStatus;

  @IsOptional()
  @IsString()
  resolutionNotes?: string;
}
