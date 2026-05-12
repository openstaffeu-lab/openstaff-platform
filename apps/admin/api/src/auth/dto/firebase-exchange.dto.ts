import { IsString, MinLength } from 'class-validator';

export class FirebaseExchangeDto {
  @IsString()
  @MinLength(10)
  idToken!: string;
}
