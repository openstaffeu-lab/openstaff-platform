import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

const TRUST_ACTIONS = [
  'APPROVE_ACCOUNT',
  'REJECT_ACCOUNT',
  'REQUEST_MORE_INFO',
  'APPROVE_PROFILE',
  'REJECT_PROFILE',
  'SUSPEND_PROFILE',
  'REACTIVATE_PROFILE',
  'ESCALATE_REVIEW',
  'REQUIRE_2FA',
  'CLEAR_2FA_LOCK',
] as const;

export type AdminTrustAction =
  | 'APPROVE_ACCOUNT'
  | 'REJECT_ACCOUNT'
  | 'REQUEST_MORE_INFO'
  | 'APPROVE_PROFILE'
  | 'REJECT_PROFILE'
  | 'SUSPEND_PROFILE'
  | 'REACTIVATE_PROFILE'
  | 'ESCALATE_REVIEW'
  | 'REQUIRE_2FA'
  | 'CLEAR_2FA_LOCK';

export class AdminTrustActionDto {
  @IsIn(TRUST_ACTIONS)
  action!: AdminTrustAction;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}
