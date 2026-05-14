import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ProcessPayrollCycleDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
