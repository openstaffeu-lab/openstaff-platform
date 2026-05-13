import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class MarkInvoicePaidDto {
  @IsString()
  @IsIn(['MANUAL', 'BANK_TRANSFER'])
  provider!: 'MANUAL' | 'BANK_TRANSFER';

  @IsOptional()
  @IsString()
  @MaxLength(200)
  providerPaymentId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  fiscalSeries?: string;
}
