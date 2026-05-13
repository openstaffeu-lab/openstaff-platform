import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpsertBillingProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  companyName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  vatId?: string;

  @IsString()
  @MaxLength(80)
  country!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  region?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;

  @IsString()
  @MaxLength(180)
  addressLine1!: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  addressLine2?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  postalCode?: string;

  @IsString()
  @MaxLength(10)
  currency!: string;

  @IsBoolean()
  isCompany!: boolean;

  @IsBoolean()
  isVatPayer!: boolean;

  @IsOptional()
  @IsString()
  @IsIn(['DOMESTIC', 'EU_REVERSE_CHARGE', 'EXPORT', 'EXEMPT'])
  vatMode?: 'DOMESTIC' | 'EU_REVERSE_CHARGE' | 'EXPORT' | 'EXEMPT';
}
