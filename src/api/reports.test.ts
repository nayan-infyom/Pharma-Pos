import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getGstReport, getMonthlyTrend, getProfitAndLoss, getSalesSummary, getTopMedicines } from './reports';
import { setAccessToken } from './client';

function jsonResponse(body: unknown): Response {
  return { status: 200, ok: true, json: async () => body } as Response;
}

describe('src/api/reports', () => {
  beforeEach(() => setAccessToken(null));
  afterEach(() => vi.unstubAllGlobals());

  it('returns the sales summary response verbatim — no client-side recomputation', async () => {
    const backendResponse = {
      from: '2026-01-01T00:00:00.000Z',
      to: '2026-09-02T00:00:00.000Z',
      grossSales: 50000,
      totalDiscounts: 1200,
      netSales: 48800,
      taxTotal: 5400,
      invoiceCount: 42,
      paymentMethodBreakdown: [{ method: 'Cash', total: 30000, count: 25 }]
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ success: true, data: backendResponse })));

    const result = await getSalesSummary();

    expect(result).toEqual(backendResponse);
  });

  it('forwards from/to date-range params for profit-and-loss', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ success: true, data: { grossSales: 0 } }));
    vi.stubGlobal('fetch', fetchMock);

    await getProfitAndLoss({ from: '2026-08-01', to: '2026-08-31' });

    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain('/reports/profit-loss');
    expect(url).toContain('from=2026-08-01');
    expect(url).toContain('to=2026-08-31');
  });

  it('does not recompute netGstPayable — passes the backend value through unchanged, including when purchases exceed sales tax', async () => {
    // Backend already floors this at 0 server-side; the frontend must not
    // independently subtract totalGstPaidOnPurchases from totalGstCollected.
    const backendResponse = { from: '2026-01-01', to: '2026-09-02', totalGstCollected: 100, totalGstPaidOnPurchases: 300, netGstPayable: 0 };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ success: true, data: backendResponse })));

    const result = await getGstReport();

    expect(result.netGstPayable).toBe(0);
    expect(result.totalGstCollected).toBe(100);
    expect(result.totalGstPaidOnPurchases).toBe(300);
  });

  it('sends the months parameter for monthly trend, defaulting to 6', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ success: true, data: [] }));
    vi.stubGlobal('fetch', fetchMock);

    await getMonthlyTrend();
    expect(fetchMock.mock.calls[0][0]).toContain('months=6');

    await getMonthlyTrend(12);
    expect(fetchMock.mock.calls[1][0]).toContain('months=12');
  });

  it('preserves top-medicines ranking order from the backend response', async () => {
    const ranked = [
      { medicineId: 'm1', medicineName: 'Dolo 650', quantitySold: 100, revenue: 3000 },
      { medicineId: 'm2', medicineName: 'Augmentin', quantitySold: 80, revenue: 15000 }
    ];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ success: true, data: ranked })));

    const result = await getTopMedicines({ limit: 2 });

    expect(result).toEqual(ranked);
  });

  it('propagates a report error (e.g. permission denied) as an ApiError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      { status: 403, ok: false, json: async () => ({ success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } }) } as Response
    ));

    await expect(getSalesSummary()).rejects.toMatchObject({ code: 'FORBIDDEN', status: 403 });
  });
});
