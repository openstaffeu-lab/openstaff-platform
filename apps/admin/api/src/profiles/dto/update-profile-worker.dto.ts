import { WorkerEmploymentType, WorkerStatus } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProfileWorkerDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  phone?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  roleTitle?: string;

  @IsOptional()
  @IsEnum(WorkerEmploymentType)
  employmentType?: WorkerEmploymentType;

  @IsOptional()
  @IsEnum(WorkerStatus)
  status?: WorkerStatus;
}
