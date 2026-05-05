import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateProjectMilestoneDto {
  @IsString()
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  amountCents!: number;

  @IsOptional()
  @IsString()
  dueDate?: string;
}
