import { IsString, MinLength } from 'class-validator';

export class DisableTwoFactorDto {
  @IsString()
  @MinLength(6)
  password!: string;
}
