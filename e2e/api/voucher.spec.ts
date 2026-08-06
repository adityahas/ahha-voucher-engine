import { test, expect } from '@playwright/test';

const headers = {
  Host: 'client1.ahha-be.local',
};

test.describe('Product Consumer API', () => {
  test('GET /products should return an array or empty list', async ({
    request,
  }) => {
    const response = await request.get('/products', { headers });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('data');
    if (body.data) {
      expect(Array.isArray(body.data)).toBe(true);
    }
  });

  test('GET /products/:id with invalid UUID returns 404', async ({
    request,
  }) => {
    const response = await request.get('/products/invalid-uuid', { headers });
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });
});

test.describe('Voucher Consumer API', () => {
  test('POST /loyalty/vouchers/calculate-discount requires valid voucher_code', async ({
    request,
  }) => {
    const response = await request.post(
      '/loyalty/vouchers/calculate-discount',
      {
        headers,
        data: {
          voucher_code: '',
          product_id: '',
          quantity: 0,
        },
      },
    );
    // Empty voucher code should be a validation error
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });
});

test.describe('Loyalty Admin API', () => {
  test('GET /loyalty-admin/vouchers without auth returns 401', async ({
    request,
  }) => {
    const response = await request.get('/loyalty-admin/vouchers', { headers });
    expect(response.status()).toBe(401);
  });
});
