import { WorkerEmploymentType } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateProfileWorkerDto {
  @IsString()
  @MaxLength(120)
  firstName!: string;

  @IsString()
  @MaxLength(120)
  lastName!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  phone?: string;

  @IsString()
  @MaxLength(160)
  roleTitle!: string;

  @IsEnum(WorkerEmploymentType)
  employmentType!: WorkerEmploymentType;
}
