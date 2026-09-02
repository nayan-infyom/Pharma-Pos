import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createExpense, deleteExpense, listExpenses } from './expenses';
import { setAccessToken } from './client';

function jsonResponse(status: number, body: unknown): Response {
  return { status, ok: status >= 200 && status < 300, json: async () => body } as Response;
}

describe('src/api/expenses', () => {
  beforeEach(() => setAccessToken(null));
  afterEach(() => vi.unstubAllGlobals());

  it('lists expenses with category/page/limit forwarded as query params', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(200, { success: true, data: [{ id: 'e1', title: 'Rent', category: 'Rent', amount: 500, date: '2026-09-01', paymentMethod: 'Cash' }], pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } })
    );
    vi.stubGlobal('fetch', fetchMock);

    const { items, pagination } = await listExpenses({ category: 'Rent', page: 1, limit: 20 });

    expect(items[0].title).toBe('Rent');
    expect(pagination.total).toBe(1);
    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain('category=Rent');
    expect(url).toContain('page=1');
    expect(url).toContain('limit=20');
  });

  it('posts only the fields the backend accepts on create — no client-computed recordedBy', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(201, { success: true, data: { id: 'e2' } }));
    vi.stubGlobal('fetch', fetchMock);

    await createExpense({ title: 'Backup Generator Fuel', category: 'Utilities', amount: 1200, paymentMethod: 'UPI', notes: 'Monthly' });

    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body);
    expect(body).toEqual({ title: 'Backup Generator Fuel', category: 'Utilities', amount: 1200, paymentMethod: 'UPI', notes: 'Monthly' });
    expect(body.recordedBy).toBeUndefined();
  });

  it('surfaces a validation error (e.g. non-positive amount) as an ApiError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      jsonResponse(400, { success: false, error: { code: 'VALIDATION_ERROR', message: 'Expense amount must be greater than 0' } })
    ));

    await expect(createExpense({ title: 'x', category: 'Other', amount: -5, paymentMethod: 'Cash' })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      message: 'Expense amount must be greater than 0'
    });
  });

  it('deletes an expense by id', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { success: true, data: { deleted: true } }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await deleteExpense('e1');

    expect(result.deleted).toBe(true);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/expenses/e1');
    expect(init.method).toBe('DELETE');
  });
});
