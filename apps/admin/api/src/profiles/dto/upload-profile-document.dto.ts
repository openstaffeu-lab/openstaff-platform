import { ProfileAssetKind, ProfileDocumentType } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UploadProfileDocumentDto {
  @IsOptional()
  @IsEnum(ProfileDocumentType)
  type?: ProfileDocumentType;

  @IsOptional()
  @IsEnum(ProfileAssetKind)
  assetKind?: ProfileAssetKind;

  @IsString()
  @MaxLength(160)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;
}
