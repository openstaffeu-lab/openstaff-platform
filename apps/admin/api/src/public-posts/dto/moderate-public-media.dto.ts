import { IsIn, IsOptional, IsString } from 'class-validator';

export class ModeratePublicMediaDto {
  @IsIn(['PENDING', 'APPROVED', 'REJECTED', 'FLAGGED'])
  status!: 'PENDING' | 'APPROVED' | 'REJECTED' | 'FLAGGED';

  @IsOptional()
  @IsString()
  moderationReason?: string;
}
