import { ProjectEngagementModel, ProjectStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

export class ListProjectsQueryDto {
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsEnum(ProjectEngagementModel)
  engagementModel?: ProjectEngagementModel;

  @IsOptional()
  @IsUUID()
  createdById?: string;
}
