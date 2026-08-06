import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getCurrencySettings } from './settings';

vi.mock('../store/auth.store', () => ({
  useAuthStore: {
    getState: () => ({ token: 'runtime-token', apiKey: 'runtime-api-key' }),
  },
}));

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

  it('uses configured runtime headers without a client1 or tenant override fallback', async () => {
    await getCurrencySettings();
    expect(fetch).toHaveBeenCalledWith(
      'https://tenant.example.test/product/settings/currency',
      expect.objectContaining({
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer runtime-token',
          'x-api-key': 'runtime-api-key',
        },
      }),
    );
    const [, request] = vi.mocked(fetch).mock.calls[0];
    expect(JSON.stringify(request)).not.toContain('client1');
    expect(JSON.stringify(request)).not.toContain('x-tenant-override');
  });
});
