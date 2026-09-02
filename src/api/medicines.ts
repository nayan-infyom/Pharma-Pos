import { apiDelete, apiGet, apiGetPaginated, apiPatch, apiPost, Pagination } from './client';
import { Medicine, Batch } from '../types';

export interface ListMedicinesParams {
  search?: string;
  category?: string;
  manufacturer?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'createdAt' | 'totalStock' | 'mrp';
  sortDir?: 'asc' | 'desc';
}

/**
 * `Batch.mfgDate`/`expiryDate` are typed YYYY-MM-DD across the frontend (see
 * types/index.ts), but Mongoose Dates serialize as full ISO datetimes over
 * JSON. Normalize once here — the single boundary all medicine data crosses
 * — rather than patch every render site that displays a batch date.
 */
function toDateOnly(value: string): string {
  return typeof value === 'string' && value.length > 10 ? value.slice(0, 10) : value;
}

function normalizeMedicine(medicine: Medicine): Medicine {
  return {
    ...medicine,
    batches: (medicine.batches ?? []).map((b) => ({ ...b, mfgDate: toDateOnly(b.mfgDate), expiryDate: toDateOnly(b.expiryDate) }))
  };
}

export async function listMedicines(params: ListMedicinesParams = {}): Promise<{ items: Medicine[]; pagination: Pagination }> {
  const { items, pagination } = await apiGetPaginated<Medicine>('/medicines', { ...params });
  return { items: items.map(normalizeMedicine), pagination };
}
export async function getMedicineById(id: string): Promise<Medicine> {
  return normalizeMedicine(await apiGet<Medicine>(`/medicines/${id}`));
}
export async function getMedicineByBarcode(barcode: string): Promise<Medicine> {
  return normalizeMedicine(await apiGet<Medicine>(`/medicines/barcode/${encodeURIComponent(barcode)}`));
}
export async function createMedicine(body: Partial<Medicine>): Promise<Medicine> {
  return normalizeMedicine(await apiPost<Medicine>('/medicines', body));
}
export async function updateMedicine(id: string, updates: Partial<Medicine>): Promise<Medicine> {
  return normalizeMedicine(await apiPatch<Medicine>(`/medicines/${id}`, updates));
}
export async function archiveMedicine(id: string): Promise<Medicine> {
  return normalizeMedicine(await apiDelete<Medicine>(`/medicines/${id}`));
}
export async function addBatch(medicineId: string, batch: Partial<Batch>): Promise<Medicine> {
  return normalizeMedicine(await apiPost<Medicine>(`/medicines/${medicineId}/batches`, batch));
}
export async function updateBatchMeta(medicineId: string, batchId: string, updates: Partial<Batch>): Promise<Medicine> {
  return normalizeMedicine(await apiPatch<Medicine>(`/medicines/${medicineId}/batches/${batchId}`, updates));
}
