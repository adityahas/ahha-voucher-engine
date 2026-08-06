import { Controller, Get, Req } from '@nestjs/common';
import { ClientSettingsService } from '@core/database/client-settings/client-settings.service';
import { CurrencySettings } from '@core/database/client-settings/client-settings.types';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: ClientSettingsService) {}

  @Get('currency')
  async getCurrency(@Req() request: Request): Promise<CurrencySettings> {
    const settings = await this.settingsService.getForTenant(
      request['client'].database_name,
    );

    const { currency_code, locale, number_format_options } = settings;
    return { currency_code, locale, number_format_options };
  }
}
