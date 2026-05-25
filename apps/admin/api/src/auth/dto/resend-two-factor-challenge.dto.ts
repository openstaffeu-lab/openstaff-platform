import { IsString } from 'class-validator';

export class ResendTwoFactorChallengeDto {
  @IsString()
  challengeId!: string;
}
