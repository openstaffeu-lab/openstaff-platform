import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class GenerateInvoiceDto {
  @IsString()
  userId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  billingEventIds!: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(90)
  dueDays?: number;
}
