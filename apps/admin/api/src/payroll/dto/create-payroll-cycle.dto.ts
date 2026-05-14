import { IsDateString } from 'class-validator';

export class CreatePayrollCycleDto {
  @IsDateString()
  periodStart!: string;

  @IsDateString()
  periodEnd!: string;
}
