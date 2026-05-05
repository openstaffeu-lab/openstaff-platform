import { ProjectPaymentStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateProjectPaymentStatusDto {
  @IsEnum(ProjectPaymentStatus)
  status!: ProjectPaymentStatus;

  @IsOptional()
  @IsString()
  approvedAt?: string;

  @IsOptional()
  @IsString()
  releasedAt?: string;
}
