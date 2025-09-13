import { VoucherEntity } from '@core/loyalty/voucher/entities/voucher.entity';

export class VoucherResponseDto {
  code: string;
  description: string;
  image: string;

  constructor(code: string, description: string, image: string) {
    this.code = code;
    this.description = description;
    this.image = image;
  }

  static fromEntity(voucher: VoucherEntity) {
    return new VoucherResponseDto(
      voucher.code,
      voucher.description,
      voucher.image,
    );
  }
}
