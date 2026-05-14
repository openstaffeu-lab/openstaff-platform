import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ApprovePayrollSettlementDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
