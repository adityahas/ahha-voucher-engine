// create-voucher.dto.ts
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from '@nestjs/class-validator';
import { Type } from '@nestjs/class-transformer';
import { CreateVoucherCategoryDto } from './create-voucher-category.dto';
import { CreateVoucherValidityDto } from './create-voucher-validity.dto';
import { CreateVoucherBindingDto } from './create-voucher-binding.dto';
import { IsUUID, IsEnum, IsNumber } from 'class-validator';
import {
  VoucherType,
  DiscountType,
  ClaimPeriod,
} from '@core/loyalty/voucher/entities/voucher.entity';

export class CreateVoucherDto {
  @IsEnum(VoucherType)
  @IsOptional()
  voucher_type?: VoucherType;

  @IsEnum(ClaimPeriod)
  @IsOptional()
  claim_period?: ClaimPeriod;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  quota: number;

  @IsEnum(DiscountType)
  @IsOptional()
  discount_type?: DiscountType;

  @IsNumber()
  @IsOptional()
  discount_value?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVoucherCategoryDto)
  categories: CreateVoucherCategoryDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVoucherCategoryDto)
  allow_combine_categories: CreateVoucherCategoryDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVoucherValidityDto)
  validities: CreateVoucherValidityDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVoucherBindingDto)
  bindings: CreateVoucherBindingDto[];

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  target_users: string[];
}
