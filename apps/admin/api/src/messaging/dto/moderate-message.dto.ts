import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class ModerateMessageDto {
  @IsIn(['PENDING', 'APPROVED', 'REJECTED', 'FLAGGED'])
  moderationStatus!: 'PENDING' | 'APPROVED' | 'REJECTED' | 'FLAGGED';

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  moderationNotes?: string;

  @IsOptional()
  @IsBoolean()
  isFlagged?: boolean;

  @IsOptional()
  @IsBoolean()
  applyToAttachments?: boolean;
}
