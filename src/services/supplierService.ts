import { Supplier } from '../types';
import { initialSuppliers } from '../data/suppliers';

const STORAGE_KEY = 'pharmapos_suppliers_v1';

class SupplierService {
  private suppliers: Supplier[];

  constructor() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        this.suppliers = JSON.parse(saved);
      } catch (e) {
        this.suppliers = initialSuppliers;
      }
    } else {
      this.suppliers = initialSuppliers;
      this.persist();
    }
  }

  private persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.suppliers));
  }

  async getAll(): Promise<Supplier[]> {
    return [...this.suppliers];
  }

  async getById(id: string): Promise<Supplier | undefined> {
    return this.suppliers.find(s => s.id === id);
  }

  async search(query?: string): Promise<Supplier[]> {
    const q = (query || '').toLowerCase().trim();
    if (!q) return this.suppliers;
    return this.suppliers.filter(s =>
      (s.name || '').toLowerCase().includes(q) ||
      (s.contactPerson || '').toLowerCase().includes(q) ||
      (s.phone || '').includes(q) ||
      (s.gstin || '').toLowerCase().includes(q)
    );
  }

  async create(supplier: Omit<Supplier, 'id' | 'totalPurchases'>): Promise<Supplier> {
    const newSupplier: Supplier = {
      ...supplier,
      id: `sup-${Date.now()}`,
      totalPurchases: 0
    };
    this.suppliers.unshift(newSupplier);
    this.persist();
    return newSupplier;
  }

  async update(id: string, updates: Partial<Supplier>): Promise<Supplier> {
    const index = this.suppliers.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Supplier not found');
    this.suppliers[index] = { ...this.suppliers[index], ...updates };
    this.persist();
    return this.suppliers[index];
  }

  async updateBalance(id: string, amountChange: number): Promise<void> {
    const supplier = this.suppliers.find(s => s.id === id);
    if (!supplier) return;
    supplier.outstandingAmount = Math.max(0, supplier.outstandingAmount + amountChange);
    this.persist();
  }
}

export const supplierService = new SupplierService();
