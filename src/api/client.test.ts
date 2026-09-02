import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiGet, apiGetPaginated, apiPost, ApiError, setAccessToken, setSessionExpiredHandler } from './client';

function jsonResponse(status: number, body: unknown): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => body
  } as Response;
}

describe('src/api/client', () => {
  beforeEach(() => {
    setAccessToken(null);
    setSessionExpiredHandler(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('unwraps a successful envelope for apiGet', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { success: true, data: { id: 'med-1' } }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await apiGet<{ id: string }>('/medicines/med-1');

    expect(result).toEqual({ id: 'med-1' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0];
    expect(init.credentials).toBe('include');
  });

  it('unwraps items + pagination for apiGetPaginated', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(200, { success: true, data: [{ id: '1' }], pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } })
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await apiGetPaginated('/medicines');

    expect(result.items).toEqual([{ id: '1' }]);
    expect(result.pagination.total).toBe(1);
  });

  it('throws an ApiError with the server error code/message on failure', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(422, { success: false, error: { code: 'INSUFFICIENT_STOCK', message: 'Not enough stock.' } })
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiPost('/sales', {})).rejects.toMatchObject({
      name: 'ApiError',
      code: 'INSUFFICIENT_STOCK',
      message: 'Not enough stock.',
      status: 422
    });
    await expect(apiPost('/sales', {})).rejects.toBeInstanceOf(ApiError);
  });

  it('retries once after a successful token refresh on 401, coalescing concurrent refreshes', async () => {
    let salesCalls = 0;
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/auth/refresh')) {
        return Promise.resolve(jsonResponse(200, { success: true, data: { accessToken: 'new-token' } }));
      }
      salesCalls += 1;
      // First call on each path is unauthorized; the retry (after refresh) succeeds.
      if (salesCalls <= 2) return Promise.resolve(jsonResponse(401, { success: false, error: { code: 'UNAUTHORIZED', message: 'Expired' } }));
      return Promise.resolve(jsonResponse(200, { success: true, data: { id: 'sale-1' } }));
    });
    vi.stubGlobal('fetch', fetchMock);

    const [a, b] = await Promise.all([apiGet('/sales/1'), apiGet('/sales/2')]);

    expect(a).toEqual({ id: 'sale-1' });
    expect(b).toEqual({ id: 'sale-1' });
    // Both original 401s should share one refresh call, not one each.
    const refreshCalls = fetchMock.mock.calls.filter(([url]) => String(url).includes('/auth/refresh'));
    expect(refreshCalls).toHaveLength(1);
  });

  it('invokes the session-expired handler when refresh also fails', async () => {
    const onExpired = vi.fn();
    setSessionExpiredHandler(onExpired);

    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/auth/refresh')) return Promise.resolve(jsonResponse(401, { success: false, error: { code: 'UNAUTHORIZED', message: 'no' } }));
      return Promise.resolve(jsonResponse(401, { success: false, error: { code: 'UNAUTHORIZED', message: 'Expired' } }));
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiGet('/sales/1')).rejects.toBeInstanceOf(ApiError);
    expect(onExpired).toHaveBeenCalledTimes(1);
  });
});
