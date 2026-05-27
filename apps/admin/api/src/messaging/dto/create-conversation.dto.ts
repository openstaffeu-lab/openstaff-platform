import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateConversationDto {
  @IsIn([
    'PROJECT',
    'CONTRACT',
    'DISPUTE',
    'DIRECT',
    'WORKFORCE',
    'PAYROLL',
    'RELU',
    'SUPPORT',
  ])
  type!:
    | 'PROJECT'
    | 'CONTRACT'
    | 'DISPUTE'
    | 'DIRECT'
    | 'WORKFORCE'
    | 'PAYROLL'
    | 'RELU'
    | 'SUPPORT';

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsUUID()
  publicPostId?: string;

  @IsOptional()
  @IsUUID()
  contractId?: string;

  @IsOptional()
  @IsUUID()
  disputeId?: string;

  @IsOptional()
  @IsUUID()
  workforceAssignmentId?: string;

  @IsOptional()
  @IsUUID()
  payrollCycleId?: string;

  @IsOptional()
  @IsUUID()
  payrollSettlementId?: string;

  @IsOptional()
  @IsUUID()
  reluRecommendationId?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(10)
  @IsUUID('4', { each: true })
  participantUserIds?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;
}
