import { Body, Controller, Get, Inject, Req, UseGuards } from '@nestjs/common';
import { VoucherLcService } from './voucher-lc.service';
import { GetEligibleVoucherDto } from './dto/get-eligible-voucher.dto';
import { ConsumerJwtGuard } from '@core/auth/guards/consumer-jwt.guard';
import { Request } from 'express';

@Controller('vouchers')
export class VoucherLcController {
  constructor(
    @Inject('VOUCHER_LC_SERVICE')
    private readonly voucherService: VoucherLcService,
  ) {}

  @Get('/eligible')
  @UseGuards(ConsumerJwtGuard)
  getEligibleVouchers(@Body() dto: GetEligibleVoucherDto) {
    return this.voucherService.getEligibleVouchers(dto);
  }

  @Get('/my')
  @UseGuards(ConsumerJwtGuard)
  getClaimedVouchers(@Req() req: Request) {
    return this.voucherService.getClaimedVouchers(req.user['id']);
  }
}
