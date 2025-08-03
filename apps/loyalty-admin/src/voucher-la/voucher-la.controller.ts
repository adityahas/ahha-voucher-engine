import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { VoucherLaService } from './voucher-la.service';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';
import { AclGuard } from '@core/auth/guards/acl.guard';
import { AdminJwtGuard } from '@core/auth/guards/admin-jwt.guard';
import { Permissions } from '@core/auth/decorators/permissions.decorator';
import { BasePaginationDto } from '@core/base/dto/base-pagination.dto';

@Controller('/loyalty-admin/vouchers')
export class VoucherLaController {
  constructor(
    @Inject('VOUCHER_SERVICE')
    private readonly voucherService: VoucherLaService,
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
  findAll(@Query() paginationDto: BasePaginationDto) {
    return this.voucherService.findAll(paginationDto);
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
