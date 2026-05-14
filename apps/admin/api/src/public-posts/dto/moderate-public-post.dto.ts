export class ModeratePublicPostDto {
  status!: 'PENDING' | 'APPROVED' | 'REJECTED';
  moderationReason?: string;
}
