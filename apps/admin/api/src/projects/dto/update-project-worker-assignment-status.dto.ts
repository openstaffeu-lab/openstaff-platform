import { ProjectWorkerAssignmentStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateProjectWorkerAssignmentStatusDto {
  @IsEnum(ProjectWorkerAssignmentStatus)
  status!: ProjectWorkerAssignmentStatus;
}
