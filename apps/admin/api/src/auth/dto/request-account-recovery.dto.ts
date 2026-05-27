import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class RequestAccountRecoveryDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsIn(['GENERAL', 'LOCKED', 'COMPROMISED'])
  reason?: 'GENERAL' | 'LOCKED' | 'COMPROMISED';

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
