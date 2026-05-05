import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class CheckInWorkerDto {
  @IsUUID('4')
  workerId!: string;

  @IsOptional()
  @IsUUID('4')
  assignmentId?: string;

  @IsOptional()
  @IsUUID('4')
  jobRequestId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  locationLat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  locationLng?: number;
}
