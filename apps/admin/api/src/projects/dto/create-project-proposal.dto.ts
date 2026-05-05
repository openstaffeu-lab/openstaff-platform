import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateProjectProposalDto {
  @IsOptional()
  @IsUUID('4')
  invitationId?: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  priceCents?: number;

  @IsOptional()
  @IsString()
  currencyCode?: string;

  @IsOptional()
  @IsString()
  estimatedStartDate?: string;

  @IsOptional()
  @IsString()
  estimatedEndDate?: string;

  @IsOptional()
  @IsString()
  terms?: string;
}
