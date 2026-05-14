import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateWorkforceAssignmentDto {
  @IsUUID()
  applicationId!: string;

  @IsUUID()
  contractId!: string;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
