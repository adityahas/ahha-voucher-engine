import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { VoucherService } from './voucher.service';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';
import { GetVoucherEligibleVoucherDto } from './dto/get-voucher-eligible-voucher.dto';
import { UseAdminJwtGuard } from '../../auth/auth.decorator';

@Controller('vouchers')
export class VoucherController {
  constructor(
    @Inject('VOUCHER_SERVICE')
    private readonly voucherService: VoucherService,
  ) {}

  @Post()
  @UseAdminJwtGuard()
  create(@Body() createVoucherDto: CreateVoucherDto) {
    return this.voucherService.create(createVoucherDto);
  }

  @Get()
  @UseAdminJwtGuard()
  findAll() {
    return this.voucherService.findAll();
  }

  @Get('/eligible')
  @UseAdminJwtGuard()
  getEligibleVouchers(@Body() dto: GetVoucherEligibleVoucherDto) {
    return this.voucherService.getEligibleVouchers(dto);
  }

  @Get(':id')
  @UseAdminJwtGuard()
  findOne(@Param('id') id: string) {
    return this.voucherService.findOne(id);
  }

  @Patch(':id')
  @UseAdminJwtGuard()
  update(@Param('id') id: string, @Body() updateVoucherDto: UpdateVoucherDto) {
    return this.voucherService.update(id, updateVoucherDto);
  }

  @Delete(':id')
  @UseAdminJwtGuard()
  remove(@Param('id') id: string) {
    return this.voucherService.remove(+id);
  }
}
