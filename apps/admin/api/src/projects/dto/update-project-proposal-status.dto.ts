import { ProjectProposalStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateProjectProposalStatusDto {
  @IsEnum(ProjectProposalStatus)
  status!: ProjectProposalStatus;
}
