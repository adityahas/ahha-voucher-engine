import {
  IsArray,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from '@nestjs/class-validator';
import { Type } from '@nestjs/class-transformer';
import { CreateVoucherBindingDto } from './create-voucher-binding.dto';

export class GetVoucherEligibleVoucherDto {
  @IsString()
  @IsNotEmpty()
  user_id: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVoucherBindingDto)
  bindings: CreateVoucherBindingDto[];
}
