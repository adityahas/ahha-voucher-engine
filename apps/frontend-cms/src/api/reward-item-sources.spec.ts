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
        headers: expect.objectContaining({
          Authorization: 'Bearer token',
          'x-api-key': 'api-key',
          'x-tenant-override': 'tenant',
        }),
      }),
    );
  });

  it('gets a source by id', async () => {
    await getRewardSource('source-1');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8080/loyalty-admin/reward-item-source/source-1',
      expect.any(Object),
    );
  });

  it('creates a source with a JSON body', async () => {
    const input = { name: 'GoPay', source_type: 'gopay', apiKey: 'secret' };
    await createRewardSource(input);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8080/loyalty-admin/reward-item-source',
      expect.objectContaining({ method: 'POST', body: JSON.stringify(input) }),
    );
  });

  it('updates a source with a JSON body', async () => {
    const input = { name: 'Updated', source_type: 'gopay' };
    await updateRewardSource('source-1', input);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8080/loyalty-admin/reward-item-source/source-1',
      expect.objectContaining({ method: 'PATCH', body: JSON.stringify(input) }),
    );
  });

  it('deletes a source', async () => {
    await deleteRewardSource('source-1');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8080/loyalty-admin/reward-item-source/source-1',
      expect.objectContaining({ method: 'DELETE' }),
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
