import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class ChangeUserSubscriptionDto {
  @IsString()
  @IsIn(['BASIC', 'BRONZE', 'GOLD', 'ENTERPRISE'])
  planCode!: 'BASIC' | 'BRONZE' | 'GOLD' | 'ENTERPRISE';

  @IsOptional()
  @IsString()
  @IsIn(['ACTIVE'])
  status?: 'ACTIVE';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
