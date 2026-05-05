import { IsOptional, IsUUID } from 'class-validator';

export class CreateProjectWorkerAssignmentDto {
  @IsUUID('4')
  workerId!: string;

  @IsOptional()
  @IsUUID('4')
  profileId?: string;

  @IsOptional()
  @IsUUID('4')
  contractId?: string;

  @IsOptional()
  @IsUUID('4')
  jobRequestId?: string;
}
