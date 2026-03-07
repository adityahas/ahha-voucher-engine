import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Inject,
  Query,
  UseGuards,
  ParseUUIDPipe,
  Patch,
} from '@nestjs/common';
import { VoucherCategoryService } from './voucher-category.service';
import { BasePaginationDto } from '@core/base/dto/base-pagination.dto';
import { CreateVoucherCategoryDto } from './dto/create-voucher-category.dto';
import { UpdateVoucherCategoryDto } from './dto/update-voucher-category.dto';
import { ResponseVoucherCategoryDto } from './dto/response-voucher-category.dto';
import { AdminJwtGuard } from '@core/auth/guards/admin-jwt.guard';
import { AclGuard } from '@core/auth/guards/acl.guard';
import { Permissions } from '@core/auth/decorators/permissions.decorator';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiResponse,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';

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

  @Get(':id')
  @ApiOperation({ summary: 'Get voucher category by ID' })
  @UseGuards(AdminJwtGuard, AclGuard)
  @Permissions('read:voucher-categories')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ResponseVoucherCategoryDto> {
    const voucherCategory = await this.voucherCategoryService.findOne(id);
    return plainToInstance(ResponseVoucherCategoryDto, voucherCategory);
  }

  @Post()
  @ApiOperation({ summary: 'Create new voucher category' })
  @UseGuards(AdminJwtGuard, AclGuard)
  @Permissions('write:voucher-categories')
  @ApiResponse({ type: ResponseVoucherCategoryDto })
  async create(
    @Body() createVoucherCategoryDto: CreateVoucherCategoryDto,
  ): Promise<ResponseVoucherCategoryDto> {
    const voucherCategory = await this.voucherCategoryService.create(
      createVoucherCategoryDto,
    );
    return plainToInstance(ResponseVoucherCategoryDto, voucherCategory);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update voucher category' })
  @UseGuards(AdminJwtGuard, AclGuard)
  @Permissions('write:voucher-categories')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateVoucherCategoryDto: UpdateVoucherCategoryDto,
  ): Promise<ResponseVoucherCategoryDto> {
    const voucherCategory = await this.voucherCategoryService.update(
      id,
      updateVoucherCategoryDto,
    );
    return plainToInstance(ResponseVoucherCategoryDto, voucherCategory);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete voucher category' })
  @UseGuards(AdminJwtGuard, AclGuard)
  @Permissions('write:voucher-categories')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ success: boolean }> {
    await this.voucherCategoryService.remove(id);
    return { success: true };
  }
}
