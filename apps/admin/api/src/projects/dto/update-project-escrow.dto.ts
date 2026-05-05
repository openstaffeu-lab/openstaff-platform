import { Type } from 'class-transformer';
import { ProjectEscrowStatus } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateProjectEscrowDto {
  @IsOptional()
  @IsEnum(ProjectEscrowStatus)
  status?: ProjectEscrowStatus;

  @IsOptional()
  @IsString()
  currencyCode?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  totalAmountCents?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  fundedAmountCents?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  releasedAmountCents?: number;
}
