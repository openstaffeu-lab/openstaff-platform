import { IsIn } from 'class-validator';

export class UpdateWorkerTimesheetStatusDto {
  @IsIn(['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'LOCKED'])
  status!: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'LOCKED';
}
