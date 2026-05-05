import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateWorkerSkillDto {
  @IsOptional()
  @IsUUID('4')
  escoSkillId?: string;

  @IsString()
  @MaxLength(160)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  level?: string;
}
