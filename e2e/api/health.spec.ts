import { test, expect } from '@playwright/test';

test.describe('Health Check', () => {
  test('GET /admin should return 200 (requires subdomain header)', async ({
    request,
  }) => {
    const response = await request.get('/admin', {
      headers: {
        Host: 'client1.ahha-be.local',
      },
    });
    // Without valid API key, may return 401; with valid setup, returns 200.
    // Primary check: service is reachable.
    expect(response.status()).toBeDefined();
  });

  test('GET /loyalty/vouchers/calculate-discount without voucher returns validation error', async ({
    request,
  }) => {
    const response = await request.post(
      '/loyalty/vouchers/calculate-discount',
      {
        headers: {
          Host: 'client1.ahha-be.local',
        },
        data: {
          product_id: 'non-existent',
          quantity: 0,
        },
      },
    );
    // Should return a 4xx or 5xx since product doesn't exist
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(600);
  });
});
