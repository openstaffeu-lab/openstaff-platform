import { IsString } from 'class-validator';

export class ConfirmTrustTokenDto {
  @IsString()
  token!: string;
}
