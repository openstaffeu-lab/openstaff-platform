import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ActorType, FirmaStatus, LegalType, PlatformRole } from '@prisma/client';

class CreateCompanyProfileDto {
  @IsString()
  name!: string;

  @IsEnum(LegalType)
  legalType!: LegalType;

  @IsString()
  cui!: string;

  @IsOptional()
  @IsString()
  cnp?: string;

  @IsOptional()
  @IsString()
  seriesCi?: string;

  @IsOptional()
  @IsString()
  ciFileUrl?: string;

  @IsOptional()
  @IsString()
  administrator?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  nrAngajati?: number;

  @IsOptional()
  @IsString()
  experientaSimilara?: string;

  @IsOptional()
  @IsEnum(FirmaStatus)
  statusFirma?: FirmaStatus;

  @IsOptional()
  @IsString()
  contBancar?: string;

  @IsOptional()
  @IsString()
  adresa?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  obiectActivitate?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  experientaMunca?: number;

  @IsOptional()
  @IsString()
  cazierUrl?: string;

  @IsOptional()
  @IsString()
  adeverintaMedicalaUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  certificariUrls?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  serviciiIds?: string[];
}

export class CreateActorDto {
  @IsOptional()
  @IsString()
  firebaseUid?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsEnum(ActorType)
  actorType!: ActorType;

  @IsOptional()
  @IsString()
  @MaxLength(2)
  countryCode?: string;

  @IsOptional()
  @IsString()
  regionCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  languageCode?: string;

  @IsOptional()
  @IsString()
  vatNumber?: string;

  @IsOptional()
  @IsBoolean()
  vatRegistered?: boolean;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  naceCode?: string;

  @IsOptional()
  @IsString()
  naceDescription?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  escoOccupations?: string[];

  @IsOptional()
  @IsString()
  uniclassCode?: string;

  @IsString()
  displayName!: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  experienceYears?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  onboardingStep?: number;

  @IsOptional()
  @IsBoolean()
  onboardingDone?: boolean;

  @IsOptional()
  @IsEnum(PlatformRole)
  role?: PlatformRole;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateCompanyProfileDto)
  companyProfile?: CreateCompanyProfileDto;
}
