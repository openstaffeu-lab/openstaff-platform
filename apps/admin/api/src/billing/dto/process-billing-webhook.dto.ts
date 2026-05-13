import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class ProcessBillingWebhookDto {
  @IsOptional()
  @IsString()
  @IsIn(['PROCESSED', 'FAILED'])
  status?: 'PROCESSED' | 'FAILED';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
