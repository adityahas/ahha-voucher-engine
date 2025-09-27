import {
  Body,
  Controller,
  Get,
  Inject,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { VoucherService } from './voucher.service';
import { GetEligibleVoucherDto } from './dto/get-eligible-voucher.dto';
import { ConsumerJwtGuard } from '@core/auth/guards/consumer-jwt.guard';
import { Request } from 'express';
import { GetClaimedVoucherResponseDto } from './dto/get-claimed-voucher-response.dto';
import { VoucherResponseDto } from './dto/voucher-response.dto';
import { BasePaginationDto } from '@core/base/dto/base-pagination.dto';
import { BasePaginationResponseInterface } from '@core/base/dto/base-response.interface';

@Controller('/loyalty/vouchers')
export class VoucherController {
  constructor(
    @Inject('VOUCHER_SERVICE')
    private readonly voucherService: VoucherService,
  ) {}

  @Get()
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
    console.log('user ', req.user);
    return this.voucherService.getClaimedVouchers(
      req.user['userId'],
      paginationDto,
    );
  }
}
