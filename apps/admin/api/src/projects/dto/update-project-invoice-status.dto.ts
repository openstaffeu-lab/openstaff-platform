import { ProjectInvoiceStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateProjectInvoiceStatusDto {
  @IsEnum(ProjectInvoiceStatus)
  status!: ProjectInvoiceStatus;

  @IsOptional()
  @IsString()
  issuedAt?: string;

  @IsOptional()
  @IsString()
  paidAt?: string;
}
