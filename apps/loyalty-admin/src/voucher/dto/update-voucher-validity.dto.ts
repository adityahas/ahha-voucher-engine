import { PartialType } from '@nestjs/mapped-types';
import { CreateVoucherValidityDto } from './create-voucher-validity.dto';

export class UpdateVoucherValidityDto extends PartialType(
  CreateVoucherValidityDto,
) {}
