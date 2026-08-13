import { ClientSettingsEntity } from '../entities/client-settings.entity';
import {
  DEFAULT_CURRENCY_SETTINGS,
  DEFAULT_LOYALTY_SETTINGS,
} from './client-settings.types';
import { ClientSettingsService } from './client-settings.service';

describe('ClientSettingsService', () => {
  const repository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };
  let service: ClientSettingsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ClientSettingsService(repository as any);
  });

  it('returns defaults when the tenant has no settings row', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(service.getForTenant('tenant_a')).resolves.toEqual(
      DEFAULT_CURRENCY_SETTINGS,
    );
    expect(repository.findOne).toHaveBeenCalledWith({
      where: { client_database_name: 'tenant_a' },
    });
  });

  it('normalizes currency codes and accepts valid locales', async () => {
    repository.findOne.mockResolvedValue(null);
    repository.save.mockImplementation(async (value) => value);

    await expect(
      service.updateForTenant('tenant_a', {
        currency_code: 'usd',
        locale: 'en-US',
        number_format_options: { useGrouping: false },
      }),
    ).resolves.toEqual({
      currency_code: 'USD',
      locale: 'en-US',
      number_format_options: { useGrouping: false },
    });
    expect(repository.findOne).toHaveBeenCalledWith({
      where: { client_database_name: 'tenant_a' },
    });
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({ client_database_name: 'tenant_a' }),
    );
  });

  it.each([
    ['invalid currency', { currency_code: 'US' }],
    ['invalid locale', { locale: 'not-a-locale' }],
    ['unsupported option', { number_format_options: { unsupported: true } }],
    [
      'unsupported rounding mode',
      { number_format_options: { roundingMode: 'unsupported' } },
    ],
  ])('rejects %s', async (_name, input) => {
    await expect(
      service.updateForTenant('tenant_a', input as any),
    ).rejects.toThrow();
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('updates only the supplied tenant row', async () => {
    repository.findOne.mockResolvedValue({
      client_database_name: 'tenant_a',
      ...DEFAULT_CURRENCY_SETTINGS,
      currency_code: 'usd',
    } as ClientSettingsEntity);
    repository.save.mockImplementation(async (value) => value);

    await expect(
      service.updateForTenant('tenant_a', { locale: 'fr-FR' }),
    ).resolves.toEqual({
      currency_code: 'USD',
      locale: 'fr-FR',
      number_format_options: {},
    });

    expect(repository.findOne).toHaveBeenCalledWith({
      where: { client_database_name: 'tenant_a' },
    });
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        client_database_name: 'tenant_a',
        currency_code: 'USD',
      }),
    );
  });

  it('clears persisted number format overrides when reset with an empty object', async () => {
    repository.findOne.mockResolvedValue({
      client_database_name: 'tenant_a',
      currency_code: 'IDR',
      locale: 'id-ID',
      number_format_options: { useGrouping: false },
    } as ClientSettingsEntity);
    repository.save.mockImplementation(async (value) => value);

    await expect(
      service.updateForTenant('tenant_a', { number_format_options: {} }),
    ).resolves.toEqual({
      currency_code: 'IDR',
      locale: 'id-ID',
      number_format_options: {},
    });
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({ number_format_options: {} }),
    );
  });
});

describe('ClientSettingsService loyalty settings', () => {
  let service: ClientSettingsService;
  const repoMock = {
    findOne: jest.fn().mockResolvedValue(null),
    save: jest.fn().mockImplementation((e) => Promise.resolve(e)),
    create: jest.fn((d) => d),
  };

  beforeEach(() => {
    service = new ClientSettingsService(repoMock as any);
  });

  it('returns defaults when no row exists', async () => {
    const result = await service.getLoyaltySettings('client1_db');
    expect(result.point_base_rate).toBe(
      DEFAULT_LOYALTY_SETTINGS.point_base_rate,
    );
    expect(result.max_combined_discount_percent).toBe(
      DEFAULT_LOYALTY_SETTINGS.max_combined_discount_percent,
    );
  });
});
