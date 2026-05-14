import { WorkSessionSource } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

export class AttendanceCheckInDto {
  @IsUUID()
  workforceAssignmentId!: string;

  @IsOptional()
  @IsEnum(WorkSessionSource)
  source?: WorkSessionSource;

  @IsOptional()
  locationMetadata?: Record<string, unknown>;
}
