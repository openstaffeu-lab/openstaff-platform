import { UserTaskStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateUserTaskStatusDto {
  @IsEnum(UserTaskStatus)
  status!: UserTaskStatus;

  @IsOptional()
  @IsString()
  completedAt?: string;
}
