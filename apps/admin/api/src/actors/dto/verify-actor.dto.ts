import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class VerifyActorDto {
  @IsOptional()
  @IsBoolean()
  verified?: boolean;

  @IsOptional()
  @IsString()
  reason?: string;
}
