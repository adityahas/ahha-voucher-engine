import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createRewardSource,
  deleteRewardSource,
  getRewardSource,
  getRewardSources,
  updateRewardSource,
} from './reward-item-sources';

vi.mock('../store/auth.store', () => ({
  useAuthStore: {
    getState: () => ({ token: 'token', apiKey: 'api-key', tenant: 'tenant' }),
  },
}));

const fetchMock = vi.fn();

const source = {
  id: 'source-1',
  name: 'GoPay',
  source_type: 'gopay',
};

const authHeaders = {
  Authorization: 'Bearer token',
  'x-api-key': 'api-key',
  'x-tenant-override': 'tenant',
};

describe('reward item source API', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({ ok: true, json: async () => source });
  });

  it('lists sources with pagination and auth headers', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [source] }),
    });

    await expect(getRewardSources()).resolves.toEqual([source]);

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8080/loyalty-admin/reward-item-source?page=0&size=100',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining(authHeaders),
      }),
    );
  });

  it('gets a source by id', async () => {
    await getRewardSource('source-1');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8080/loyalty-admin/reward-item-source/source-1',
      expect.objectContaining({
        headers: expect.objectContaining(authHeaders),
      }),
    );
  });

  it('creates a source with a JSON body', async () => {
    const input = { name: 'GoPay', source_type: 'gopay', apiKey: 'secret' };
    await createRewardSource(input);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8080/loyalty-admin/reward-item-source',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(input),
        headers: expect.objectContaining(authHeaders),
      }),
    );
  });

  it('updates a source with a JSON body', async () => {
    const input = { name: 'Updated', source_type: 'gopay' };
    await updateRewardSource('source-1', input);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8080/loyalty-admin/reward-item-source/source-1',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify(input),
        headers: expect.objectContaining(authHeaders),
      }),
    );
  });

  it('deletes a source on a 204 response', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 204 });
    await deleteRewardSource('source-1');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8080/loyalty-admin/reward-item-source/source-1',
      expect.objectContaining({
        method: 'DELETE',
        headers: expect.objectContaining(authHeaders),
      }),
    );
  });

  it('throws the server message for failed responses', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Forbidden' }),
    });
    await expect(getRewardSources()).rejects.toThrow('Forbidden');
  });
});
