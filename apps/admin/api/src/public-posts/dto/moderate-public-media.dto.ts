export class ModeratePublicMediaDto {
  status!: 'PENDING' | 'APPROVED' | 'REJECTED';
  moderationReason?: string;
}
