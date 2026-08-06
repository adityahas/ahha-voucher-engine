import { SettingsController } from './settings.controller';

describe('SettingsController', () => {
  it('uses the active tenant for reads and updates', async () => {
    const service = {
      getForTenant: jest.fn().mockResolvedValue({}),
      updateForTenant: jest.fn().mockResolvedValue({}),
    };
    const controller = new SettingsController(service as any);
    const request = { client: { database_name: 'tenant_a' } };

    await controller.getCurrency(request as any);
    await controller.updateCurrency(
      request as any,
      {
        currency_code: 'USD',
        tenant_id: 'tenant_b',
      } as any,
    );

    expect(service.getForTenant).toHaveBeenCalledWith('tenant_a');
    expect(service.updateForTenant).toHaveBeenCalledWith('tenant_a', {
      currency_code: 'USD',
    });
  });
});
