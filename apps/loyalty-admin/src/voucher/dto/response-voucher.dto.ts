import { Expose, Type } from '@nestjs/class-transformer';
import { ResponseVoucherCategoryDto } from '../../voucher-category/dto/response-voucher-category.dto';
import { ResponseLoyaltyUserDto } from './response-loyalty-user.dto';

import {
  VoucherType,
  DiscountType,
} from '@core/loyalty/voucher/entities/voucher.entity';

export class ResponseVoucherDto {
  @Expose()
  voucher_type: VoucherType;

  @Expose()
  code: string;

  @Expose()
  description: string;

  @Expose()
  quota: number;

  @Expose()
  image: string;

  @Expose()
  discount_type: DiscountType;

  @Expose()
  discount_value: number;

  @Expose()
  @Type(() => ResponseVoucherCategoryDto)
  categories: ResponseVoucherCategoryDto[];

  @Expose()
  @Type(() => ResponseVoucherCategoryDto)
  allow_combine_categories: ResponseVoucherCategoryDto[];

  @Expose()
  @Type(() => ResponseLoyaltyUserDto)
  target_users: ResponseLoyaltyUserDto[];

  @Expose()
  created_at: Date;

  @Expose()
  updated_at: Date;
}
