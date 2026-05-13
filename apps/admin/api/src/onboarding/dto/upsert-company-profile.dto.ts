import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class UpsertCompanyProfileDto {
  @IsString()
  @MaxLength(160)
  companyName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  legalName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  registrationNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  vatId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  addressLine1?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  addressLine2?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  postalCode?: string;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsOptional()
  @IsUrl()
  logoUrl?: string;
}
