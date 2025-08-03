import {
  Body,
  Controller,
  Get,
  Inject,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { VoucherLcService } from './voucher-lc.service';
import { GetEligibleVoucherDto } from './dto/get-eligible-voucher.dto';
import { ConsumerJwtGuard } from '@core/auth/guards/consumer-jwt.guard';
import { Request } from 'express';
import { GetClaimedVoucherResponseDto } from './dto/get-claimed-voucher-response.dto';
import { VoucherResponseDto } from './dto/voucher-response.dto';
import { BasePaginationDto } from '@core/base/dto/base-pagination.dto';
import { BasePaginationResponseInterface } from '@core/base/dto/base-response.interface';

@Controller('vouchers')
export class VoucherLcController {
  constructor(
    @Inject('VOUCHER_LC_SERVICE')
    private readonly voucherService: VoucherLcService,
  ) {}

  @Get('/eligible')
  @UseGuards(ConsumerJwtGuard)
  getEligibleVouchers(
    @Body() dto: GetEligibleVoucherDto,
  ): Promise<VoucherResponseDto[]> {
    return this.voucherService.getEligibleVouchers(dto);
  }

  @Get('/my')
  @UseGuards(ConsumerJwtGuard)
  async getClaimedVouchers(
    @Req() req: Request,
    @Query() paginationDto: BasePaginationDto,
  ): Promise<BasePaginationResponseInterface<GetClaimedVoucherResponseDto>> {
    return this.voucherService.getClaimedVouchers(
      req.user['id'],
      paginationDto,
    );
  }
}
