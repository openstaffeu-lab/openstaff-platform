import { ProjectMilestoneStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateProjectMilestoneStatusDto {
  @IsEnum(ProjectMilestoneStatus)
  status!: ProjectMilestoneStatus;

  @IsOptional()
  @IsString()
  completedAt?: string;
}
