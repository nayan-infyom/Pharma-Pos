import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createEmployee, listEmployees, updateEmployee } from './employees';
import { setAccessToken } from './client';

function jsonResponse(status: number, body: unknown): Response {
  return { status, ok: status >= 200 && status < 300, json: async () => body } as Response;
}

describe('src/api/employees', () => {
  beforeEach(() => setAccessToken(null));
  afterEach(() => vi.unstubAllGlobals());

  it('lists employees with search/role/status forwarded as query params', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(200, { success: true, data: [{ id: 'e1', name: 'Priya Sharma' }], pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } })
    );
    vi.stubGlobal('fetch', fetchMock);

    const { items } = await listEmployees({ search: 'Priya', role: 'Cashier', status: 'Active', page: 1, limit: 20 });

    expect(items[0].name).toBe('Priya Sharma');
    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain('search=Priya');
    expect(url).toContain('role=Cashier');
    expect(url).toContain('status=Active');
  });

  it('posts the submitted role/permissions on create — the server derives nothing implicit here', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(201, { success: true, data: { id: 'e2' } }));
    vi.stubGlobal('fetch', fetchMock);

    await createEmployee({ name: 'Rohan Verma', email: 'rohan@apexpharma.com', phone: '9811122233', role: 'Cashier', permissions: ['view_pos', 'create_sale'] });

    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body);
    expect(body.permissions).toEqual(['view_pos', 'create_sale']);
    expect(body.role).toBe('Cashier');
  });

  it('sends only the changed fields on a partial update (status + permissions)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { success: true, data: { id: 'e1', status: 'On Leave' } }));
    vi.stubGlobal('fetch', fetchMock);

    await updateEmployee('e1', { status: 'On Leave', permissions: ['view_pos'] });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/employees/e1');
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(init.body)).toEqual({ status: 'On Leave', permissions: ['view_pos'] });
  });

  it('surfaces a duplicate-email conflict as an ApiError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      jsonResponse(409, { success: false, error: { code: 'DUPLICATE_RESOURCE', message: 'A record with these details already exists' } })
    ));

    await expect(createEmployee({ name: 'x', email: 'dup@apexpharma.com', phone: '9800000000', role: 'Cashier' })).rejects.toMatchObject({
      code: 'DUPLICATE_RESOURCE',
      status: 409
    });
  });

  it('surfaces a permission-denied response as an ApiError with FORBIDDEN code', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      jsonResponse(403, { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } })
    ));

    await expect(listEmployees()).rejects.toMatchObject({ code: 'FORBIDDEN', status: 403 });
  });
});
