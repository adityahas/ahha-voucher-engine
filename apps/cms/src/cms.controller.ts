import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CmsService } from './cms.service';
import { LoginAdminDto } from './dto/login-admin.dto';
import { BaseController } from '@core/base/base.controller';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { AdminJwtGuard } from '@core/auth/guards/admin-jwt.guard';
import { AclGuard } from '@core/auth/guards/acl.guard';
import { Permissions } from '@core/auth/decorators/permissions.decorator';

@Controller()
export class CmsController extends BaseController {
  constructor(private readonly cmsService: CmsService) {
    super();
  }

  @Post('/admin/login')
  login(@Req() req: Request, @Body() loginAdminDto: LoginAdminDto) {
    return this.cmsService.login(this.getDatabaseName(req), loginAdminDto);
  }

  @Post()
  @UseGuards(AdminJwtGuard, AclGuard)
  @Permissions('write:users')
  create(@Body() createAdminDto: CreateAdminDto) {
    return this.cmsService.create(createAdminDto);
  }

  @Get()
  @UseGuards(AdminJwtGuard, AclGuard)
  @Permissions('read:users')
  findAll() {
    return this.cmsService.findAll();
  }

  @Get(':id')
  @UseGuards(AdminJwtGuard, AclGuard)
  @Permissions('read:users')
  findOne(@Param('id') id: string) {
    return this.cmsService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(AdminJwtGuard, AclGuard)
  @Permissions('write:users')
  update(@Param('id') id: string, @Body() updateAdminDto: UpdateAdminDto) {
    return this.cmsService.update(+id, updateAdminDto);
  }

  @Delete(':id')
  @UseGuards(AdminJwtGuard, AclGuard)
  @Permissions('write:users')
  remove(@Param('id') id: string) {
    return this.cmsService.remove(+id);
  }
}
