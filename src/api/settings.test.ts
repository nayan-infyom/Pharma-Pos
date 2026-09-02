import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getSettings, updateSettings } from './settings';
import { setAccessToken } from './client';

function jsonResponse(status: number, body: unknown): Response {
  return { status, ok: status >= 200 && status < 300, json: async () => body } as Response;
}

const FULL_CONFIG = {
  store: { name: 'Apex Care Pharmacy & Surgical Hub', tagline: 't', address: 'a', city: 'c', state: 's', pincode: 'p', phone: 'ph', email: 'e', gstin: 'g', drugLicenseNumber20B: 'd1', drugLicenseNumber21B: 'd2', fssaiNumber: 'f' },
  pos: { defaultTaxRate: 12, invoicePrefix: 'INV-', thermalReceiptWidth: '80mm', autoPrintReceipt: true, enableSoundEffects: true, enableFEFOSuggestion: true, allowNegativeStock: false, requireDoctorNameForRx: true, roundOffTotal: true },
  inventory: { lowStockThreshold: 20, criticalStockThreshold: 5, expiryWarningDays: 90, criticalExpiryDays: 30, enforceFEFO: true, autoReorderAlerts: true }
};

describe('src/api/settings', () => {
  beforeEach(() => setAccessToken(null));
  afterEach(() => vi.unstubAllGlobals());

  it('loads the full {store, pos, inventory} config as returned by the backend', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(200, { success: true, data: FULL_CONFIG })));

    const result = await getSettings();

    expect(result).toEqual(FULL_CONFIG);
  });

  it('sends only the sub-object being changed on a partial save (pos only)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { success: true, data: FULL_CONFIG }));
    vi.stubGlobal('fetch', fetchMock);

    await updateSettings({ pos: { defaultTaxRate: 18 } });

    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body);
    expect(body).toEqual({ pos: { defaultTaxRate: 18 } });
    expect(body.store).toBeUndefined();
    expect(body.inventory).toBeUndefined();
  });

  it('surfaces a validation error (e.g. tax rate over 100) as an ApiError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      jsonResponse(400, { success: false, error: { code: 'VALIDATION_ERROR', message: 'Request validation failed' } })
    ));

    await expect(updateSettings({ pos: { defaultTaxRate: 150 } })).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('surfaces a permission-denied response as an ApiError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      jsonResponse(403, { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } })
    ));

    await expect(getSettings()).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });
});
