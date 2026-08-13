import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
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
import { CalculateDiscountDto } from './dto/calculate-discount.dto';
import { ClientSettingsService } from '@core/database/client-settings/client-settings.service';

@Controller('/loyalty/vouchers')
export class VoucherController {
  constructor(
    @Inject('VOUCHER_SERVICE')
    private readonly voucherService: VoucherService,
    private readonly settingsService: ClientSettingsService,
  ) {}

  @Post('eligible')
  @UseGuards(ConsumerJwtGuard)
  findEligibleVouchers(
    @Req() req: Request,
    @Body() dto: GetEligibleVoucherDto,
  ): Promise<VoucherResponseDto[]> {
    dto.user_id = req.user['userId'];
    return this.voucherService.findEligibleVouchers(dto);
  }

  @Get('my')
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

  @Post(':code/claim')
  @UseGuards(ConsumerJwtGuard)
  async claimVoucher(@Param('code') voucherCode: string, @Req() req: Request) {
    const userId = req.user['userId'];
    return this.voucherService.claimVoucher(userId, voucherCode);
  }

  @Post('calculate-discount')
  @UseGuards(ConsumerJwtGuard)
  async calculateDiscount(
    @Body() dto: CalculateDiscountDto,
    @Req() req: Request,
  ) {
    const userId = req.user['userId'];
    const settings = await this.settingsService.getLoyaltySettings(
      req['client'].database_name,
    );
    return this.voucherService.calculateDiscount(
      dto,
      userId,
      Number(settings.point_to_currency_rate),
    );
  }

  @Post(':code/redeem')
  @UseGuards(ConsumerJwtGuard)
  async redeemVoucher(@Param('code') voucherCode: string, @Req() req: Request) {
    const userId = req.user['userId'];
    return this.voucherService.useVoucher(userId, voucherCode);
  }
}
