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
import { VoucherBindingService } from './voucher-binding.service';
import { CreateVoucherBindingDto } from './dto/create-voucher-binding.dto';
import { UpdateVoucherBindingDto } from './dto/update-voucher-binding.dto';
import { AdminJwtGuard } from '@core/auth/guards/admin-jwt.guard';
import { AclGuard } from '@core/auth/guards/acl.guard';
import { Permissions } from '@core/auth/decorators/permissions.decorator';

@Controller('/loyalty-admin/vouchers/:voucherId/bindings')
export class VoucherBindingController {
  constructor(
    @Inject('VOUCHER_BINDING_SERVICE')
    private readonly voucherBindingService: VoucherBindingService,
  ) {}

  @Post()
  @UseGuards(AdminJwtGuard, AclGuard)
  @Permissions('write:vouchers')
  create(
    @Param('voucherId') voucherId: string,
    @Body() createDto: CreateVoucherBindingDto,
  ) {
    return this.voucherBindingService.create(voucherId, createDto);
  }

  @Get()
  @UseGuards(AdminJwtGuard, AclGuard)
  @Permissions('read:vouchers')
  findAll(@Param('voucherId') voucherId: string) {
    return this.voucherBindingService.findAll(voucherId);
  }

  @Get(':id')
  @UseGuards(AdminJwtGuard, AclGuard)
  @Permissions('read:vouchers')
  findOne(@Param('id') id: string) {
    return this.voucherBindingService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(AdminJwtGuard, AclGuard)
  @Permissions('write:vouchers')
  update(@Param('id') id: string, @Body() updateDto: UpdateVoucherBindingDto) {
    return this.voucherBindingService.update(+id, updateDto);
  }

  @Delete(':id')
  @UseGuards(AdminJwtGuard, AclGuard)
  @Permissions('write:vouchers')
  remove(@Param('voucherId') voucherId: string, @Param('id') id: string) {
    return this.voucherBindingService.remove(voucherId, +id);
  }
}
