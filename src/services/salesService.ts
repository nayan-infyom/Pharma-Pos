import { SaleInvoice } from '../types';
import { initialSales } from '../data/sales';
import { medicineService } from './medicineService';
import { customerService } from './customerService';
import { inventoryService } from './inventoryService';

const STORAGE_KEY = 'pharmapos_sales_v1';

class SalesService {
  private sales: SaleInvoice[];

  constructor() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        this.sales = JSON.parse(saved);
      } catch (e) {
        this.sales = initialSales;
      }
    } else {
      this.sales = initialSales;
      this.persist();
    }
  }

  private persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.sales));
  }

  async getAll(): Promise<SaleInvoice[]> {
    return [...this.sales];
  }

  async getById(id: string): Promise<SaleInvoice | undefined> {
    return this.sales.find(s => s.id === id);
  }

  async getByInvoiceNumber(invNum: string): Promise<SaleInvoice | undefined> {
    return this.sales.find(s => s.invoiceNumber.toLowerCase() === invNum.toLowerCase());
  }

  async createSale(saleData: Omit<SaleInvoice, 'id' | 'invoiceNumber' | 'date'>): Promise<SaleInvoice> {
    const today = new Date();
    const count = this.sales.length + 1001;
    const invoiceNumber = `INV-${today.getFullYear()}-${count}`;

    const newSale: SaleInvoice = {
      ...saleData,
      id: `sale-${Date.now()}`,
      invoiceNumber,
      date: new Date().toISOString()
    };

    // 1. Deduct stock for all items
    for (const item of newSale.items) {
      await medicineService.deductStock(item.medicineId, item.batchId, item.quantity);
      
      // Record stock movement
      await inventoryService.recordMovement({
        medicineId: item.medicineId,
        medicineName: item.medicineName,
        batchNumber: item.batchNumber,
        type: 'Sale',
        quantityChange: -item.quantity,
        previousStock: item.availableBatchStock,
        newStock: Math.max(0, item.availableBatchStock - item.quantity),
        user: newSale.cashierName,
        referenceId: invoiceNumber,
        notes: `POS Sale to ${newSale.customerName}`
      });
    }

    // 2. Record customer purchase
    if (newSale.customerId) {
      await customerService.recordPurchase(
        newSale.customerId,
        newSale.grandTotal,
        newSale.paymentMethod === 'Credit'
      );
    }

    this.sales.unshift(newSale);
    this.persist();
    return newSale;
  }

  async refundSale(saleId: string, refundedItems: { medicineId: string; batchId: string; quantity: number }[]): Promise<void> {
    const sale = this.sales.find(s => s.id === saleId);
    if (!sale) return;

    sale.status = 'Refunded';
    
    // Add stock back
    for (const item of refundedItems) {
      await medicineService.addStock(item.medicineId, item.batchId, item.quantity);
    }

    this.persist();
  }
}

export const salesService = new SalesService();
