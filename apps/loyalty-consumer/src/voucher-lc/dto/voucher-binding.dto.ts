import { IsEnum, IsNotEmpty, IsString } from '@nestjs/class-validator';
import { VoucherBindingType } from '@core/loyalty/voucher/entities/voucher-binding.entity';

export class VoucherBindingDto {
  @IsEnum(VoucherBindingType, {
    message: `bind_type must one of the following values: ${Object.values(VoucherBindingType).join(', ')}`,
  })
  bind_type: string;

  @IsString()
  @IsNotEmpty()
  bind_value: VoucherBindingType;
}
