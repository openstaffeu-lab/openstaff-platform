import { IsString, MaxLength } from 'class-validator';

export class RejectTimesheetDto {
  @IsString()
  @MaxLength(1000)
  reason!: string;
}
