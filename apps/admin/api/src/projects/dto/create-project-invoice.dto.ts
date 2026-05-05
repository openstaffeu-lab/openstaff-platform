import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateProjectInvoiceDto {
  @IsOptional()
  @IsString()
  milestoneId?: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  amountCents!: number;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  currencyCode?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  vatCents?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  dueDate?: string;
}
