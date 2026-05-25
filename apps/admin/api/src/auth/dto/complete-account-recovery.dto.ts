import { IsString, MinLength } from 'class-validator';

export class CompleteAccountRecoveryDto {
  @IsString()
  token!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
