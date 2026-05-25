import { IsString, Length } from 'class-validator';

export class VerifyTwoFactorChallengeDto {
  @IsString()
  challengeId!: string;

  @IsString()
  @Length(4, 32)
  code!: string;
}
