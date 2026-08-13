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
import { TierAdminService } from './tier-admin.service';
import { CreateTierDto } from './dto/create-tier.dto';
import { UpdateTierDto } from './dto/update-tier.dto';
import { BasePaginationDto } from '@core/base/dto/base-pagination.dto';
import { AdminJwtGuard } from '@core/auth/guards/admin-jwt.guard';
import { AclGuard } from '@core/auth/guards/acl.guard';
import { Permissions } from '@core/auth/decorators/permissions.decorator';

@Controller('/loyalty-admin/tiers')
@UseGuards(AdminJwtGuard, AclGuard)
export class TierController {
  constructor(
    @Inject('TIER_ADMIN_SERVICE')
    private readonly tierService: TierAdminService,
  ) {}

  @Post()
  @Permissions('manage:tiers')
  create(@Body() dto: CreateTierDto) {
    return this.tierService.create(dto);
  }

  @Get()
  @Permissions('manage:tiers')
  findAll(@Query() paginationDto: BasePaginationDto) {
    return this.tierService.findAll(paginationDto);
  }

  @Get(':id')
  @Permissions('manage:tiers')
  findOne(@Param('id') id: string) {
    return this.tierService.findOne(id);
  }

  @Patch(':id')
  @Permissions('manage:tiers')
  update(@Param('id') id: string, @Body() dto: UpdateTierDto) {
    return this.tierService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('manage:tiers')
  remove(@Param('id') id: string) {
    return this.tierService.remove(id);
  }
}
