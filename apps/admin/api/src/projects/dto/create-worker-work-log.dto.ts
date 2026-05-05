import { WorkerWorkLogStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class CreateWorkerWorkLogDto {
  @IsUUID('4')
  workerId!: string;

  @IsOptional()
  @IsUUID('4')
  assignmentId?: string;

  @IsOptional()
  @IsUUID('4')
  jobRequestId?: string;

  @IsString()
  date!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  hoursWorked!: number;

  @IsString()
  @MaxLength(2000)
  description!: string;

  @IsOptional()
  @IsEnum(WorkerWorkLogStatus)
  status?: WorkerWorkLogStatus;
}
