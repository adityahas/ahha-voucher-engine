import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Inject,
} from '@nestjs/common';
import { VoucherValidityService } from './voucher-validity.service';
import { CreateVoucherValidityDto } from './dto/create-voucher-validity.dto';
import { UpdateVoucherValidityDto } from './dto/update-voucher-validity.dto';
import { AdminJwtGuard } from '@core/auth/guards/admin-jwt.guard';
import { AclGuard } from '@core/auth/guards/acl.guard';
import { Permissions } from '@core/auth/decorators/permissions.decorator';

@Controller('loyalty-admin/vouchers/:voucherId/validities')
@UseGuards(AdminJwtGuard, AclGuard)
export class VoucherValidityController {
  constructor(
    @Inject('VOUCHER_VALIDITY_SERVICE')
    private readonly validitiesService: VoucherValidityService,
  ) {}

  @Post()
  @Permissions('write:vouchers')
  create(
    @Param('voucherId') voucherId: string,
    @Body() createDto: CreateVoucherValidityDto,
  ) {
    return this.validitiesService.create(voucherId, createDto);
  }

  @Get()
  @Permissions('read:vouchers')
  findAll(@Param('voucherId') voucherId: string) {
    return this.validitiesService.findAll(voucherId);
  }

  @Get(':id')
  @Permissions('read:vouchers')
  findOne(@Param('voucherId') voucherId: string, @Param('id') id: string) {
    return this.validitiesService.findOne(voucherId, +id);
  }

  @Patch(':id')
  @Permissions('write:vouchers')
  update(
    @Param('voucherId') voucherId: string,
    @Param('id') id: string,
    @Body() updateDto: UpdateVoucherValidityDto,
  ) {
    return this.validitiesService.update(voucherId, +id, updateDto);
  }

  @Delete(':id')
  @Permissions('write:vouchers')
  remove(@Param('voucherId') voucherId: string, @Param('id') id: string) {
    return this.validitiesService.remove(voucherId, +id);
  }
}
