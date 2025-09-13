import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common';
import { VoucherCategoryService } from './voucher-category.service';
import { BasePaginationDto } from '@core/base/dto/base-pagination.dto';
import { AdminJwtGuard } from '@core/auth/guards/admin-jwt.guard';
import { AclGuard } from '@core/auth/guards/acl.guard';
import { Permissions } from '@core/auth/decorators/permissions.decorator';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Voucher Categories')
@ApiBearerAuth()
@Controller('/loyalty-admin/voucher-categories')
export class VoucherCategoryController {
  constructor(
    @Inject('VOUCHER_CATEGORY_SERVICE')
    private readonly voucherCategoryService: VoucherCategoryService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all voucher categories' })
  @UseGuards(AdminJwtGuard, AclGuard)
  @Permissions('read:voucher-categories')
  findAll(@Query() paginationDto: BasePaginationDto) {
    return this.voucherCategoryService.findAll(paginationDto);
  }
}
