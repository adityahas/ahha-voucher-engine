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
import { CreateUserDto } from 'src/user/dto/create-user.dto';

export class CreateVoucherDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  quota: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVoucherCategoryDto)
  categories: CreateVoucherCategoryDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVoucherCategoryDto)
  allow_combine_categories: CreateVoucherCategoryDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVoucherValidityDto)
  validities: CreateVoucherValidityDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVoucherBindingDto)
  bindings: CreateVoucherBindingDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateUserDto)
  target_users: CreateUserDto[];
}
