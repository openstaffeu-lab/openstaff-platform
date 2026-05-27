import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateMessageDto {
  @IsOptional()
  @IsIn(['TEXT', 'FILE'])
  type?: 'TEXT' | 'FILE';

  @IsString()
  @MaxLength(5000)
  content!: string;

  @IsOptional()
  metadataJson?: unknown;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  attachmentIds?: string[];
}
