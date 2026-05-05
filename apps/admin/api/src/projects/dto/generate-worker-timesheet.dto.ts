import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class GenerateWorkerTimesheetDto {
  @IsUUID()
  workerId!: string;

  @IsOptional()
  @IsUUID()
  contractId?: string;

  @IsDateString()
  periodStart!: string;

  @IsDateString()
  periodEnd!: string;
}
