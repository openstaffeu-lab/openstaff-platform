import { IsIn, IsOptional, IsUUID } from 'class-validator';

export class AddConversationParticipantDto {
  @IsUUID()
  userId!: string;

  @IsOptional()
  @IsIn(['OWNER', 'ADMIN', 'MEMBER', 'OBSERVER', 'CONTRACTOR', 'WORKER', 'SUPERVISOR'])
  role?:
    | 'OWNER'
    | 'ADMIN'
    | 'MEMBER'
    | 'OBSERVER'
    | 'CONTRACTOR'
    | 'WORKER'
    | 'SUPERVISOR';
}
