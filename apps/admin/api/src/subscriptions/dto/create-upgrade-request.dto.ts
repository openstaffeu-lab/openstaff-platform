import { IsEmail, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { SubscriptionPlanCode } from '@prisma/client';

export class CreateUpgradeRequestDto {
  @IsString()
  @IsIn([SubscriptionPlanCode.BRONZE, SubscriptionPlanCode.GOLD, SubscriptionPlanCode.ENTERPRISE])
  requestedPlanCode!: 'BRONZE' | 'GOLD' | 'ENTERPRISE';

  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  companyName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  message?: string;

  @IsOptional()
  @IsString()
  @IsIn(['PRICING', 'LIMIT_REACHED', 'CONTACT_SALES'])
  source?: 'PRICING' | 'LIMIT_REACHED' | 'CONTACT_SALES';
}
