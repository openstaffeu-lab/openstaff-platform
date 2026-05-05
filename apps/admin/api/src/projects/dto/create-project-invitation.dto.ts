import { ProjectInvitationStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateProjectInvitationDto {
  @IsUUID('4')
  profileId!: string;

  @IsOptional()
  @IsEnum(ProjectInvitationStatus)
  status?: ProjectInvitationStatus;

  @IsOptional()
  @IsString()
  message?: string;
}
