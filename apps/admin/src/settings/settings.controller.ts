import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { AclGuard } from '@core/auth/guards/acl.guard';
import { AdminJwtGuard } from '@core/auth/guards/admin-jwt.guard';
import { Permissions } from '@core/auth/decorators/permissions.decorator';
import { ClientSettingsService } from '@core/database/client-settings/client-settings.service';
import { UpdateCurrencySettingsDto } from './dto/update-currency-settings.dto';

@Controller('admin/settings')
@UseGuards(AdminJwtGuard, AclGuard)
export class SettingsController {
  constructor(private readonly settingsService: ClientSettingsService) {}

  @Get('currency')
  @Permissions('write:profile')
  getCurrency(@Req() request: Request) {
    return this.settingsService.getForTenant(request['client'].database_name);
  }

  @Put('currency')
  @Permissions('write:profile')
  updateCurrency(
    @Req() request: Request,
    @Body() input: UpdateCurrencySettingsDto,
  ) {
    const { currency_code, locale, number_format_options } = input;
    return this.settingsService.updateForTenant(
      request['client'].database_name,
      { currency_code, locale, number_format_options },
    );
  }
}
