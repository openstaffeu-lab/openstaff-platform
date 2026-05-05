import { WorkerWorkLogStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateWorkerWorkLogStatusDto {
  @IsEnum(WorkerWorkLogStatus)
  status!: WorkerWorkLogStatus;
}
