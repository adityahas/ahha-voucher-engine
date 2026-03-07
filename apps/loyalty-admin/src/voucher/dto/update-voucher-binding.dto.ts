import { PartialType } from '@nestjs/mapped-types';
import { CreateVoucherBindingDto } from './create-voucher-binding.dto';

export class UpdateVoucherBindingDto extends PartialType(CreateVoucherBindingDto) {}
