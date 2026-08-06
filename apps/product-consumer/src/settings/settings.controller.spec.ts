import { ClientSettingsService } from '@core/database/client-settings/client-settings.service';
import { SettingsController } from './settings.controller';

describe('SettingsController', () => {
  it('returns only currency settings for the middleware-resolved tenant', async () => {
    const settingsService = {
      getForTenant: jest.fn().mockResolvedValue({
        currency_code: 'USD',
        locale: 'en-US',
        number_format_options: { currencyDisplay: 'code' },
        unexpected: 'must not leak',
      }),
    } as unknown as ClientSettingsService;
    const controller = new SettingsController(settingsService);

    const response = await controller.getCurrency({
      client: { database_name: 'tenant_us' },
    } as any);

    expect(settingsService.getForTenant).toHaveBeenCalledWith('tenant_us');
    expect(response).toEqual({
      currency_code: 'USD',
      locale: 'en-US',
      number_format_options: { currencyDisplay: 'code' },
    });
    expect(response).not.toHaveProperty('unexpected');
  });
});
