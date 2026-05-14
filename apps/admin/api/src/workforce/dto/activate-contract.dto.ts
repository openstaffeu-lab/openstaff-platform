import { IsOptional, IsString, IsISO8601, MaxLength } from 'class-validator';

export class ActivateContractDto {
  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
