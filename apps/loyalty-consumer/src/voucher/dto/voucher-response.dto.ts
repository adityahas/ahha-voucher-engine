import {
  VoucherEntity,
  VoucherType,
  DiscountType,
} from '@core/loyalty/voucher/entities/voucher.entity';

export class VoucherResponseDto {
  voucher_type: VoucherType;
  code: string;
  name: string;
  description: string;
  quota: number;
  image: string;
  categories: { id: string; name: string }[];
  bindings: { bind_type: string; bind_value: string }[];
  discount_type: DiscountType;
  discount_value: number;

  constructor(
    voucher_type: VoucherType,
    code: string,
    name: string,
    description: string,
    quota: number,
    image: string,
    categories: { id: string; name: string }[] = [],
    bindings: { bind_type: string; bind_value: string }[] = [],
    discount_type: DiscountType = DiscountType.FIXED_AMOUNT,
    discount_value: number = 0,
  ) {
    this.voucher_type = voucher_type;
    this.code = code;
    this.name = name;
    this.description = description;
    this.quota = quota;
    this.image = image;
    this.categories = categories;
    this.bindings = bindings;
    this.discount_type = discount_type;
    this.discount_value = discount_value;
  }

  static fromEntity(voucher: VoucherEntity) {
    return new VoucherResponseDto(
      voucher.voucher_type,
      voucher.code,
      voucher.code, // name might be same as code if not explicit, but VoucherEntity has no name? Checking entity...
      voucher.description,
      voucher.quota,
      voucher.image,
      voucher.categories?.map((cat) => ({ id: cat.slug, name: cat.name })) ||
        [],
      voucher.bindings?.map((bind) => ({
        bind_type: bind.bind_type,
        bind_value: bind.bind_value,
      })) || [],
      voucher.discount_type,
      voucher.discount_value,
    );
  }
}
