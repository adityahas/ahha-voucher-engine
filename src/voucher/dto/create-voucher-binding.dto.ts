import { IsEnum, IsNotEmpty, IsString } from '@nestjs/class-validator';
import { VoucherBindingType } from '../entities/voucher-binding.entity';

export class CreateVoucherBindingDto {
  @IsString()
  @IsNotEmpty()
  bind_type: string;

  @IsEnum(VoucherBindingType, {
    message: `bind_type must one of the following values: ${Object.values(VoucherBindingType).join(', ')}`,
  })
  bind_value: VoucherBindingType;
}
