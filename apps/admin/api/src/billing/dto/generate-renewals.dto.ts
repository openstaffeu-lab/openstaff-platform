import { IsDateString } from 'class-validator';

export class GenerateRenewalsDto {
  @IsDateString()
  periodStart!: string;

  @IsDateString()
  periodEnd!: string;
}
