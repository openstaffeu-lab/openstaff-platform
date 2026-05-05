import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreateProjectShortlistDto {
  @IsUUID('4')
  profileId!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  matchScore?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
