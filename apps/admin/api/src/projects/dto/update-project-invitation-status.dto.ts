import { ProjectInvitationStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateProjectInvitationStatusDto {
  @IsEnum(ProjectInvitationStatus)
  status!: ProjectInvitationStatus;

  @IsOptional()
  @IsString()
  message?: string;
}
