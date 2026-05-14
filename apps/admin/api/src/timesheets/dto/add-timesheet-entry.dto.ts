import { IsISO8601, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class AddTimesheetEntryDto {
  @IsISO8601()
  workDate!: string;

  @IsNumber()
  @Min(0)
  hoursWorked!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  overtimeHours?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
