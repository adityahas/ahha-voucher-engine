import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getCurrencySettings } from './settings';

describe('getCurrencySettings', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_PRODUCT_API_URL', 'https://tenant.example.test');
    vi.stubEnv('VITE_API_BASE_URL', 'https://fallback.example.test');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              currency_code: 'USD',
              locale: 'en-US',
              number_format_options: {},
            },
          }),
      }),
    );
  });

  it('uses runtime URL without selecting a tenant', async () => {
    await getCurrencySettings();
    expect(fetch).toHaveBeenCalledWith(
      'https://tenant.example.test/product/settings/currency',
      expect.objectContaining({
        headers: expect.not.objectContaining({
          'x-tenant-override': expect.anything(),
        }),
      }),
    );
    const [, request] = vi.mocked(fetch).mock.calls[0];
    expect(JSON.stringify(request)).not.toContain('client1');
  });
});
