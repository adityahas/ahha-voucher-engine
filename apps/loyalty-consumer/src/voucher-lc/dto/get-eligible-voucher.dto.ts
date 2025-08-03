import {
  IsArray,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from '@nestjs/class-validator';
import { Type } from '@nestjs/class-transformer';
import { VoucherBindingDto } from './voucher-binding.dto';

export class GetEligibleVoucherDto {
  @IsString()
  @IsNotEmpty()
  user_id: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VoucherBindingDto)
  bindings: VoucherBindingDto[];
}
