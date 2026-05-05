import { ProjectContractStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateProjectContractStatusDto {
  @IsEnum(ProjectContractStatus)
  status!: ProjectContractStatus;
}
