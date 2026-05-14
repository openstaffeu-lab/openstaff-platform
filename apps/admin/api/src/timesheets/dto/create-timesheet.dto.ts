import { IsISO8601, IsUUID } from 'class-validator';

export class CreateTimesheetDto {
  @IsUUID()
  workforceAssignmentId!: string;

  @IsISO8601()
  periodStart!: string;

  @IsISO8601()
  periodEnd!: string;
}
