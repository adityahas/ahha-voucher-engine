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
import { AdminService } from './admin.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { LoginAdminDto } from './dto/login-admin.dto';
import { BaseController } from '../base/base.controller';
import { AdminJwtGuard } from '../auth/admin-jwt.guard';

@Controller('admin')
export class AdminController extends BaseController {
  constructor(private readonly adminService: AdminService) {
    super();
  }

  @Post('/login')
  login(@Req() req: Request, @Body() loginAdminDto: LoginAdminDto) {
    return this.adminService.login(this.getDatabaseName(req), loginAdminDto);
  }

  @Post()
  @UseGuards(AdminJwtGuard)
  create(@Body() createAdminDto: CreateAdminDto) {
    return this.adminService.create(createAdminDto);
  }

  @Get()
  @UseGuards(AdminJwtGuard)
  findAll() {
    return this.adminService.findAll();
  }

  @Get(':id')
  @UseGuards(AdminJwtGuard)
  findOne(@Param('id') id: string) {
    return this.adminService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(AdminJwtGuard)
  update(@Param('id') id: string, @Body() updateAdminDto: UpdateAdminDto) {
    return this.adminService.update(+id, updateAdminDto);
  }

  @Delete(':id')
  @UseGuards(AdminJwtGuard)
  remove(@Param('id') id: string) {
    return this.adminService.remove(+id);
  }
}
