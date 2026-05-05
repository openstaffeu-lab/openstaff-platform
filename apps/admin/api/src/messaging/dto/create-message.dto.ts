import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateMessageDto {
  @IsOptional()
  @IsIn(['TEXT', 'FILE'])
  type?: 'TEXT' | 'FILE';

  @IsString()
  @MaxLength(5000)
  content!: string;

  @IsOptional()
  metadataJson?: unknown;
}
