import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { VoucherService } from './voucher.service';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';
import { GetVoucherEligibleVoucherDto } from './dto/get-voucher-eligible-voucher.dto';
import { AdminJwtGuard } from '../../../auth/admin-jwt.guard';
import { AclGuard } from '../../../acl/acl.guard';
import { Permissions } from '../../../acl/permissions.decorator';

@Controller('vouchers')
export class VoucherController {
  constructor(
    @Inject('VOUCHER_SERVICE')
    private readonly voucherService: VoucherService,
  ) {}

  @Post()
  @UseGuards(AdminJwtGuard, AclGuard)
  @Permissions('write:vouchers')
  create(@Body() createVoucherDto: CreateVoucherDto) {
    return this.voucherService.create(createVoucherDto);
  }

  @Get()
  @UseGuards(AdminJwtGuard, AclGuard)
  @Permissions('read:vouchers')
  findAll() {
    return this.voucherService.findAll();
  }

  @Get('/eligible')
  @UseGuards(AdminJwtGuard, AclGuard)
  @Permissions('read:vouchers')
  getEligibleVouchers(@Body() dto: GetVoucherEligibleVoucherDto) {
    return this.voucherService.getEligibleVouchers(dto);
  }

  @Get(':id')
  @UseGuards(AdminJwtGuard, AclGuard)
  @Permissions('read:vouchers')
  findOne(@Param('id') id: string) {
    return this.voucherService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AdminJwtGuard, AclGuard)
  @Permissions('write:vouchers')
  update(@Param('id') id: string, @Body() updateVoucherDto: UpdateVoucherDto) {
    return this.voucherService.update(id, updateVoucherDto);
  }

  @Delete(':id')
  @UseGuards(AdminJwtGuard, AclGuard)
  @Permissions('write:vouchers')
  remove(@Param('id') id: string) {
    return this.voucherService.remove(+id);
  }
}
