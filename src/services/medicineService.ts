import { Medicine, Batch } from '../types';
import * as medicinesApi from '../api/medicines';

/**
 * Phase K: backed by the real API instead of localStorage. Method names/
 * signatures are preserved so pages don't need to change (per the approved
 * "adapter, not rewrite" strategy) — internals now call src/api/medicines.ts.
 *
 * getAll()/search() request the max page size (100, the backend's own hot-path
 * cap — see Phase E) rather than truly "all" medicines the way the old
 * localStorage version did. At current seed-catalog scale this is invisible;
 * flagged here as a known limitation until pages that browse the full catalog
 * get real pagination controls (not yet done for every page in this
 * checkpoint — see the Phase K report).
 */
class MedicineService {
  async getAll(): Promise<Medicine[]> {
    const { items } = await medicinesApi.listMedicines({ limit: 100 });
    return items;
  }

  async getById(id: string): Promise<Medicine | undefined> {
    try {
      return await medicinesApi.getMedicineById(id);
    } catch {
      return undefined;
    }
  }

  /**
   * Search semantics changed from the old client-side `.includes()` scan
   * (which also matched sku/barcode/batchNumber) to server-side Atlas Search
   * over name/genericName/brand/manufacturer (see Phase F's search writeup).
   * Exact barcode/SKU lookups still work via their own dedicated endpoints.
   */
  async search(query?: string): Promise<Medicine[]> {
    const { items } = await medicinesApi.listMedicines({ search: query || undefined, limit: 100 });
    return items;
  }

  async create(medicine: Omit<Medicine, 'id' | 'createdAt' | 'updatedAt' | 'totalStock'>): Promise<Medicine> {
    return medicinesApi.createMedicine(medicine);
  }

  async update(id: string, updates: Partial<Medicine>): Promise<Medicine> {
    return medicinesApi.updateMedicine(id, updates);
  }

  /** Now archives (soft-delete) rather than a hard delete, matching the backend contract (Phase E). */
  async delete(id: string): Promise<boolean> {
    await medicinesApi.archiveMedicine(id);
    return true;
  }

  async addBatch(medicineId: string, batch: Omit<Batch, 'id' | 'medicineId'>): Promise<Batch> {
    const medicine = await medicinesApi.addBatch(medicineId, batch);
    const created = medicine.batches[medicine.batches.length - 1];
    return created;
  }

  async updateBatch(medicineId: string, batchId: string, updates: Partial<Batch>): Promise<Batch> {
    const medicine = await medicinesApi.updateBatchMeta(medicineId, batchId, updates);
    const updated = medicine.batches.find((b) => b.id === batchId);
    if (!updated) throw new Error('Batch not found after update');
    return updated;
  }
}

export const medicineService = new MedicineService();
