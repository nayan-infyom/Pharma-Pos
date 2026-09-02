import { Medicine, Batch } from '../types';
import { initialMedicines } from '../data/medicines';

const STORAGE_KEY = 'pharmapos_medicines_v1';

class MedicineService {
  private medicines: Medicine[];

  constructor() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        this.medicines = JSON.parse(saved);
      } catch (e) {
        this.medicines = initialMedicines;
      }
    } else {
      this.medicines = initialMedicines;
      this.persist();
    }
  }

  private persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.medicines));
  }

  async getAll(): Promise<Medicine[]> {
    return [...this.medicines];
  }

  async getById(id: string): Promise<Medicine | undefined> {
    return this.medicines.find(m => m.id === id);
  }

  async search(query?: string): Promise<Medicine[]> {
    const q = (query || '').toLowerCase().trim();
    if (!q) return this.medicines;
    return this.medicines.filter(m =>
      (m.name || '').toLowerCase().includes(q) ||
      (m.genericName || '').toLowerCase().includes(q) ||
      (m.brand || '').toLowerCase().includes(q) ||
      (m.sku || '').toLowerCase().includes(q) ||
      (m.barcode || '').toLowerCase().includes(q) ||
      (m.category || '').toLowerCase().includes(q) ||
      (m.manufacturer || '').toLowerCase().includes(q) ||
      (m.batches || []).some(b => (b.batchNumber || '').toLowerCase().includes(q))
    );
  }

  async create(medicine: Omit<Medicine, 'id' | 'createdAt' | 'updatedAt' | 'totalStock'>): Promise<Medicine> {
    const totalStock = (medicine.batches || []).reduce((acc, b) => acc + (b.quantity || 0), 0);
    const newMedicine: Medicine = {
      ...medicine,
      id: `med-${Date.now()}`,
      totalStock,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.medicines.unshift(newMedicine);
    this.persist();
    return newMedicine;
  }

  async update(id: string, updates: Partial<Medicine>): Promise<Medicine> {
    const index = this.medicines.findIndex(m => m.id === id);
    if (index === -1) throw new Error('Medicine not found');

    const updatedBatches = updates.batches || this.medicines[index].batches;
    const totalStock = updatedBatches.reduce((acc, b) => acc + (b.quantity || 0), 0);

    const updated: Medicine = {
      ...this.medicines[index],
      ...updates,
      totalStock,
      updatedAt: new Date().toISOString()
    };

    this.medicines[index] = updated;
    this.persist();
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.medicines.findIndex(m => m.id === id);
    if (index === -1) return false;
    this.medicines.splice(index, 1);
    this.persist();
    return true;
  }

  async addBatch(medicineId: string, batch: Omit<Batch, 'id' | 'medicineId'>): Promise<Batch> {
    const med = await this.getById(medicineId);
    if (!med) throw new Error('Medicine not found');

    const newBatch: Batch = {
      ...batch,
      id: `bat-${Date.now()}`,
      medicineId,
      medicineName: med.name
    };

    med.batches.push(newBatch);
    await this.update(medicineId, { batches: med.batches });
    return newBatch;
  }

  async updateBatch(medicineId: string, batchId: string, updates: Partial<Batch>): Promise<Batch> {
    const med = await this.getById(medicineId);
    if (!med) throw new Error('Medicine not found');

    const bIndex = med.batches.findIndex(b => b.id === batchId);
    if (bIndex === -1) throw new Error('Batch not found');

    med.batches[bIndex] = { ...med.batches[bIndex], ...updates };
    await this.update(medicineId, { batches: med.batches });
    return med.batches[bIndex];
  }

  // Deduct inventory when sale completes (FEFO order or specific batch)
  async deductStock(medicineId: string, batchId: string, quantity: number): Promise<void> {
    const med = await this.getById(medicineId);
    if (!med) return;

    const batch = med.batches.find(b => b.id === batchId);
    if (batch) {
      batch.quantity = Math.max(0, batch.quantity - quantity);
      if (batch.quantity === 0) batch.status = 'Out of Stock';
    }

    await this.update(medicineId, { batches: med.batches });
  }

  // Restock when purchase is confirmed or sale return processed
  async addStock(medicineId: string, batchId: string, quantity: number): Promise<void> {
    const med = await this.getById(medicineId);
    if (!med) return;

    const batch = med.batches.find(b => b.id === batchId);
    if (batch) {
      batch.quantity += quantity;
      if (batch.quantity > 0 && batch.status === 'Out of Stock') {
        batch.status = 'Active';
      }
    }

    await this.update(medicineId, { batches: med.batches });
  }
}

export const medicineService = new MedicineService();
