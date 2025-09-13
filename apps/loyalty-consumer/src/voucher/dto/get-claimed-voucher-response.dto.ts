import { VoucherClaimEntity } from '@core/loyalty/voucher/entities/voucher-claim.entity';
import { VoucherResponseDto } from './voucher-response.dto';

export class GetClaimedVoucherResponseDto {
  voucher: VoucherResponseDto;

  static fromEntity(value: VoucherClaimEntity) {
    return {
      voucher: VoucherResponseDto.fromEntity(value.voucher),
    };
  }
}
