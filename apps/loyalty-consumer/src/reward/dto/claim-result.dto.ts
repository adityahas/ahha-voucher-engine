import { IsISO8601, IsOptional, IsString } from '@nestjs/class-validator';

export class ClaimResult {
  status: 'SUCCESS' | 'FAILED';

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  externalRefId?: string;

  @IsOptional()
  @IsISO8601()
  expiredAt?: string;

  @IsOptional()
  @IsString()
  errorMessage?: string;
}
