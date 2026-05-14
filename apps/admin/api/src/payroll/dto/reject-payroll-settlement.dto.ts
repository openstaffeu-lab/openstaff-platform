import { IsString, MaxLength } from 'class-validator';

export class RejectPayrollSettlementDto {
  @IsString()
  @MaxLength(1000)
  reason!: string;
}
