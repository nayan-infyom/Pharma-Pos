import { PurchaseOrder } from '../types';
import { initialPurchases } from '../data/purchases';
import { medicineService } from './medicineService';
import { inventoryService } from './inventoryService';

const STORAGE_KEY = 'pharmapos_purchases_v1';

class PurchaseService {
  private purchases: PurchaseOrder[];

  constructor() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        this.purchases = JSON.parse(saved);
      } catch (e) {
        this.purchases = initialPurchases;
      }
    } else {
      this.purchases = initialPurchases;
      this.persist();
    }
  }

  private persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.purchases));
  }

  async getAll(): Promise<PurchaseOrder[]> {
    return [...this.purchases];
  }

  async getById(id: string): Promise<PurchaseOrder | undefined> {
    return this.purchases.find(p => p.id === id);
  }

  async create(orderData: Omit<PurchaseOrder, 'id'>): Promise<PurchaseOrder> {
    const newOrder: PurchaseOrder = {
      ...orderData,
      id: `po-${Date.now()}`
    };

    // If marked received, add stock to batch or create batch
    if (newOrder.status === 'Received') {
      for (const item of newOrder.items) {
        const totalQty = item.quantity + (item.freeQuantity || 0);
        const med = await medicineService.getById(item.medicineId);
        if (med) {
          const existingBatch = med.batches.find(b => b.batchNumber === item.batchNumber);
          if (existingBatch) {
            await medicineService.addStock(item.medicineId, existingBatch.id, totalQty);
          } else {
            await medicineService.addBatch(item.medicineId, {
              batchNumber: item.batchNumber,
              supplierId: newOrder.supplierId,
              supplierName: newOrder.supplierName,
              quantity: totalQty,
              purchasePrice: item.purchasePrice,
              mrp: item.mrp,
              sellingPrice: Math.round(item.mrp * 0.92),
              mfgDate: item.mfgDate,
              expiryDate: item.expiryDate,
              status: 'Active',
              rackLocation: 'Main Storage'
            });
          }

          await inventoryService.recordMovement({
            medicineId: item.medicineId,
            medicineName: item.medicineName,
            batchNumber: item.batchNumber,
            type: 'Purchase',
            quantityChange: totalQty,
            previousStock: med.totalStock,
            newStock: med.totalStock + totalQty,
            user: 'Purchase Manager',
            referenceId: newOrder.invoiceNumber,
            notes: `Inward Purchase from ${newOrder.supplierName}`
          });
        }
      }
    }

    this.purchases.unshift(newOrder);
    this.persist();
    return newOrder;
  }
}

export const purchaseService = new PurchaseService();
