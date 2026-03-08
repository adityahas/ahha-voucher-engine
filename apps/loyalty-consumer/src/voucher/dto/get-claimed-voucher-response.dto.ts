import { VoucherClaimEntity } from '@core/loyalty/voucher/entities/voucher-claim.entity';
import { VoucherResponseDto } from './voucher-response.dto';

export class GetClaimedVoucherResponseDto {
  id: number;
  created_at: Date;
  voucher: VoucherResponseDto;

  static fromEntity(value: VoucherClaimEntity) {
    return {
      id: value.id,
      created_at: value.created_at,
      voucher: VoucherResponseDto.fromEntity(value.voucher),
    };
  }
}
