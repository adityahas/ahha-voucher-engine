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
import { VoucherService } from './voucher.service';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';
import { ResponseVoucherDto } from './dto/response-voucher.dto';
import { plainToInstance } from 'class-transformer';
import { AclGuard } from '@core/auth/guards/acl.guard';
import { AdminJwtGuard } from '@core/auth/guards/admin-jwt.guard';
import { Permissions } from '@core/auth/decorators/permissions.decorator';
import { BasePaginationDto } from '@core/base/dto/base-pagination.dto';

@Controller('/loyalty-admin/vouchers')
export class VoucherController {
  constructor(
    @Inject('VOUCHER_SERVICE')
    private readonly voucherService: VoucherService,
  ) {}

  @Post()
  @UseGuards(AdminJwtGuard, AclGuard)
  @Permissions('write:vouchers')
  async create(@Body() createVoucherDto: CreateVoucherDto) {
    const voucher = await this.voucherService.create(createVoucherDto);
    return plainToInstance(ResponseVoucherDto, voucher);
  }

  @Get()
  @UseGuards(AdminJwtGuard, AclGuard)
  @Permissions('read:vouchers')
  async findAll(@Query() paginationDto: BasePaginationDto) {
    const result = await this.voucherService.findAll(paginationDto);
    return {
      ...result,
      data: plainToInstance(ResponseVoucherDto, result.data),
    };
  }

  @Get(':id')
  @UseGuards(AdminJwtGuard, AclGuard)
  @Permissions('read:vouchers')
  async findOne(@Param('id') id: string) {
    const voucher = await this.voucherService.findOne(id);
    return plainToInstance(ResponseVoucherDto, voucher);
  }

  @Patch(':id')
  @UseGuards(AdminJwtGuard, AclGuard)
  @Permissions('write:vouchers')
  async update(@Param('id') id: string, @Body() updateVoucherDto: UpdateVoucherDto) {
    const voucher = await this.voucherService.update(id, updateVoucherDto);
    return plainToInstance(ResponseVoucherDto, voucher);
  }

  @Delete(':id')
  @UseGuards(AdminJwtGuard, AclGuard)
  @Permissions('write:vouchers')
  remove(@Param('id') id: string) {
    return this.voucherService.remove(id);
  }
}
