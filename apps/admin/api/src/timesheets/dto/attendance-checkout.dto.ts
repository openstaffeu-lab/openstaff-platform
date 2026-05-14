import { IsUUID, IsOptional } from 'class-validator';

export class AttendanceCheckOutDto {
  @IsUUID()
  workforceAssignmentId!: string;

  @IsOptional()
  locationMetadata?: Record<string, unknown>;
}
