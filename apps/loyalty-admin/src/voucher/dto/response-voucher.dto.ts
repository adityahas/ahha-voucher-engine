import { Expose, Type } from '@nestjs/class-transformer';
import { ResponseVoucherCategoryDto } from '../../voucher-category/dto/response-voucher-category.dto';
import { ResponseLoyaltyUserDto } from './response-loyalty-user.dto';

export class ResponseVoucherDto {
  @Expose()
  code: string;

  @Expose()
  description: string;

  @Expose()
  quota: number;

  @Expose()
  image: string;

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
