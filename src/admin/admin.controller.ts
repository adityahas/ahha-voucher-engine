import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { LoginAdminDto } from './dto/login-admin.dto';
import { BaseController } from '../base/base.controller';
import { UseAdminJwtGuard } from '../auth/auth.decorator';

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
  @UseAdminJwtGuard()
  create(@Body() createAdminDto: CreateAdminDto) {
    return this.adminService.create(createAdminDto);
  }

  @Get()
  @UseAdminJwtGuard()
  findAll() {
    return this.adminService.findAll();
  }

  @Get(':id')
  @UseAdminJwtGuard()
  findOne(@Param('id') id: string) {
    return this.adminService.findOne(+id);
  }

  @Patch(':id')
  @UseAdminJwtGuard()
  update(@Param('id') id: string, @Body() updateAdminDto: UpdateAdminDto) {
    return this.adminService.update(+id, updateAdminDto);
  }

  @Delete(':id')
  @UseAdminJwtGuard()
  remove(@Param('id') id: string) {
    return this.adminService.remove(+id);
  }
}
