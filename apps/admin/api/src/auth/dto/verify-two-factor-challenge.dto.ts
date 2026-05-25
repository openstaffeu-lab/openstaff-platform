import { IsString, Matches } from 'class-validator';

export class VerifyTwoFactorChallengeDto {
  @IsString()
  challengeId!: string;

  @IsString()
  @Matches(/^\d{6}$/, { message: 'Two-factor code must be exactly 6 numeric digits' })
  code!: string;
}
