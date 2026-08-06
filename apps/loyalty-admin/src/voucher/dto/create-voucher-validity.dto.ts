import {
  IsArray,
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
} from '@nestjs/class-validator';
import { VoucherValidityType } from '@core/loyalty/voucher/entities/voucher-validity.entity';

export class CreateVoucherValidityDto {
  @IsEnum(VoucherValidityType, {
    message: `type must be one of the following values: ${Object.values(VoucherValidityType).join(', ')}`,
  })
  type?: VoucherValidityType;

  @IsNotEmpty()
  @IsISO8601()
  start_date: Date;

  @IsOptional()
  @IsISO8601()
  end_date?: Date;

  @IsNotEmpty()
  @IsString()
  start_time: string;

  @IsNotEmpty()
  @IsString()
  end_time: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  valid_days?: string[];
}
