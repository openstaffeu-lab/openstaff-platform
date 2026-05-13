import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class ApproveUpgradeRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @IsOptional()
  @IsString()
  @IsIn(['PENDING', 'ISSUED', 'PAID'])
  billingStatus?: 'PENDING' | 'ISSUED' | 'PAID';
}
