import { IsIn, IsOptional, IsString } from 'class-validator';

export class ModeratePublicPostDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsIn(['PENDING', 'APPROVED', 'REJECTED', 'FLAGGED'])
  moderationStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'FLAGGED';

  @IsOptional()
  @IsIn(['PUBLIC', 'PRIVATE'])
  visibility?: 'PUBLIC' | 'PRIVATE';

  @IsOptional()
  @IsString()
  moderationReason?: string;
}
