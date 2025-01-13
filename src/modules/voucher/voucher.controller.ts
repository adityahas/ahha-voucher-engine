import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
} from '@nestjs/common';
import { VoucherService } from './voucher.service';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';
import { GetVoucherEligibleVoucherDto } from './dto/get-voucher-eligible-voucher.dto';
import { BaseController } from '../../base/base.controller';

@Controller('vouchers')
export class VoucherController extends BaseController {
  constructor(private readonly voucherService: VoucherService) {
    super();
  }

  @Post()
  create(@Req() req: Request, @Body() createVoucherDto: CreateVoucherDto) {
    return this.voucherService.create(
      this.getDatabaseName(req),
      createVoucherDto,
    );
  }

  @Get()
  findAll(@Req() req: Request) {
    return this.voucherService.findAll(this.getDatabaseName(req));
  }

  @Get('/eligible')
  getEligibleVouchers(
    @Req() req: Request,
    @Body() dto: GetVoucherEligibleVoucherDto,
  ) {
    return this.voucherService.getEligibleVouchers(
      this.getDatabaseName(req),
      dto,
    );
  }

  @Get(':id')
  findOne(@Req() req: Request, @Param('id') id: string) {
    return this.voucherService.findOne(this.getDatabaseName(req), id);
  }

  @Patch(':id')
  update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateVoucherDto: UpdateVoucherDto,
  ) {
    return this.voucherService.update(
      this.getDatabaseName(req),
      id,
      updateVoucherDto,
    );
  }

  @Delete(':id')
  remove(@Req() req: Request, @Param('id') id: string) {
    return this.voucherService.remove(this.getDatabaseName(req), +id);
  }
}
