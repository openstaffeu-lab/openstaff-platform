import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsIn,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class CreateConversationDto {
  @IsIn(['PROJECT', 'CONTRACT', 'DISPUTE', 'DIRECT'])
  type!: 'PROJECT' | 'CONTRACT' | 'DISPUTE' | 'DIRECT';

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsUUID()
  contractId?: string;

  @IsOptional()
  @IsUUID()
  disputeId?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(10)
  @IsUUID('4', { each: true })
  participantUserIds?: string[];
}
