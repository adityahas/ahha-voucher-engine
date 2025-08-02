import { Body, Controller, Get, Inject, UseGuards } from '@nestjs/common';
import { VoucherLcService } from './voucher-lc.service';
import { AdminJwtGuard } from '@core/auth/guards/admin-jwt.guard';
import { AclGuard } from '@core/auth/guards/acl.guard';
import { Permissions } from '@core/auth/decorators/permissions.decorator';
import { GetEligibleVoucherDto } from './dto/get-eligible-voucher.dto';

@Controller('vouchers')
export class VoucherLcController {
  constructor(
    @Inject('VOUCHER_LC_SERVICE')
    private readonly voucherService: VoucherLcService,
  ) {}

  @Get('/eligible')
  @UseGuards(AdminJwtGuard, AclGuard)
  @Permissions('read:vouchers')
  getEligibleVouchers(@Body() dto: GetEligibleVoucherDto) {
    return this.voucherService.getEligibleVouchers(dto);
  }
}
