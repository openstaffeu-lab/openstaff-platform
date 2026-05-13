import { IsIn, IsString } from 'class-validator';

export class UpdateUpgradeRequestStatusDto {
  @IsString()
  @IsIn(['CONTACTED', 'APPROVED', 'REJECTED', 'CLOSED'])
  status!: 'CONTACTED' | 'APPROVED' | 'REJECTED' | 'CLOSED';
}
