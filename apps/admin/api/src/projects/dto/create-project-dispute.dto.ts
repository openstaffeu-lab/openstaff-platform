import { ProjectDisputeSeverity, ProjectDisputeType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateProjectDisputeDto {
  @IsOptional()
  @IsString()
  milestoneId?: string;

  @IsOptional()
  @IsString()
  invoiceId?: string;

  @IsOptional()
  @IsString()
  paymentId?: string;

  @IsOptional()
  @IsString()
  againstProfileId?: string;

  @IsEnum(ProjectDisputeType)
  type!: ProjectDisputeType;

  @IsEnum(ProjectDisputeSeverity)
  severity!: ProjectDisputeSeverity;

  @IsString()
  @MaxLength(255)
  title!: string;

  @IsString()
  description!: string;
}
