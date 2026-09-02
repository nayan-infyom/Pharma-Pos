import { StockMovement, StockAdjustment } from '../types';
import { initialStockMovements } from '../data/stockMovements';
import { medicineService } from './medicineService';

const MOVEMENTS_STORAGE_KEY = 'pharmapos_movements_v1';
const ADJUSTMENTS_STORAGE_KEY = 'pharmapos_adjustments_v1';

class InventoryService {
  private movements: StockMovement[];
  private adjustments: StockAdjustment[];

  constructor() {
    const savedMov = localStorage.getItem(MOVEMENTS_STORAGE_KEY);
    if (savedMov) {
      try {
        this.movements = JSON.parse(savedMov);
      } catch (e) {
        this.movements = initialStockMovements;
      }
    } else {
      this.movements = initialStockMovements;
      this.persistMovements();
    }

    const savedAdj = localStorage.getItem(ADJUSTMENTS_STORAGE_KEY);
    if (savedAdj) {
      try {
        this.adjustments = JSON.parse(savedAdj);
      } catch (e) {
        this.adjustments = [];
      }
    } else {
      this.adjustments = [];
    }
  }

  private persistMovements() {
    localStorage.setItem(MOVEMENTS_STORAGE_KEY, JSON.stringify(this.movements));
  }

  private persistAdjustments() {
    localStorage.setItem(ADJUSTMENTS_STORAGE_KEY, JSON.stringify(this.adjustments));
  }

  async getMovements(): Promise<StockMovement[]> {
    return [...this.movements];
  }

  async getAdjustments(): Promise<StockAdjustment[]> {
    return [...this.adjustments];
  }

  async recordMovement(movement: Omit<StockMovement, 'id' | 'date'>): Promise<StockMovement> {
    const newMovement: StockMovement = {
      ...movement,
      id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      date: new Date().toISOString()
    };
    this.movements.unshift(newMovement);
    this.persistMovements();
    return newMovement;
  }

  async adjustStock(adjustment: Omit<StockAdjustment, 'id' | 'date'>): Promise<StockAdjustment> {
    const newAdjustment: StockAdjustment = {
      ...adjustment,
      id: `adj-${Date.now()}`,
      date: new Date().toISOString()
    };

    const med = await medicineService.getById(adjustment.medicineId);
    if (med) {
      const batch = med.batches.find(b => b.id === adjustment.batchId);
      const prevStock = batch ? batch.quantity : 0;
      let qtyChange = 0;
      let newStock = prevStock;

      if (adjustment.adjustmentType === 'Add Stock') {
        qtyChange = adjustment.quantity;
        newStock = prevStock + adjustment.quantity;
        await medicineService.addStock(adjustment.medicineId, adjustment.batchId, adjustment.quantity);
      } else if (adjustment.adjustmentType === 'Subtract Stock' || adjustment.adjustmentType === 'Mark Damaged' || adjustment.adjustmentType === 'Mark Expired') {
        qtyChange = -adjustment.quantity;
        newStock = Math.max(0, prevStock - adjustment.quantity);
        await medicineService.deductStock(adjustment.medicineId, adjustment.batchId, adjustment.quantity);
      } else if (adjustment.adjustmentType === 'Set Stock (Audit)') {
        qtyChange = adjustment.quantity - prevStock;
        newStock = adjustment.quantity;
        if (batch) {
          batch.quantity = adjustment.quantity;
          await medicineService.updateBatch(adjustment.medicineId, adjustment.batchId, { quantity: adjustment.quantity });
        }
      }

      await this.recordMovement({
        medicineId: adjustment.medicineId,
        medicineName: adjustment.medicineName,
        batchNumber: adjustment.batchNumber,
        type: adjustment.adjustmentType === 'Mark Expired' ? 'Expired' : (adjustment.adjustmentType === 'Mark Damaged' ? 'Damaged' : 'Adjustment'),
        quantityChange: qtyChange,
        previousStock: prevStock,
        newStock,
        user: adjustment.adjustedBy,
        referenceId: newAdjustment.id,
        notes: `${adjustment.reason} - ${adjustment.notes || ''}`
      });
    }

    this.adjustments.unshift(newAdjustment);
    this.persistAdjustments();
    return newAdjustment;
  }
}

export const inventoryService = new InventoryService();
