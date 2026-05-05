import { IsString } from 'class-validator';

export class CreateProjectPaymentRequestDto {
  @IsString()
  invoiceId!: string;
}
