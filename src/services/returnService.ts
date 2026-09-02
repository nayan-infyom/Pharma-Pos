import { SalesReturn, PurchaseReturn } from '../types';
import { initialSalesReturns, initialPurchaseReturns } from '../data/returns';
import { medicineService } from './medicineService';
import { inventoryService } from './inventoryService';

const SALES_RETURNS_KEY = 'pharmapos_sales_returns_v1';
const PURCHASE_RETURNS_KEY = 'pharmapos_purchase_returns_v1';

class ReturnService {
  private salesReturns: SalesReturn[];
  private purchaseReturns: PurchaseReturn[];

  constructor() {
    const savedSR = localStorage.getItem(SALES_RETURNS_KEY);
    this.salesReturns = savedSR ? JSON.parse(savedSR) : initialSalesReturns;

    const savedPR = localStorage.getItem(PURCHASE_RETURNS_KEY);
    this.purchaseReturns = savedPR ? JSON.parse(savedPR) : initialPurchaseReturns;
  }

  private persist() {
    localStorage.setItem(SALES_RETURNS_KEY, JSON.stringify(this.salesReturns));
    localStorage.setItem(PURCHASE_RETURNS_KEY, JSON.stringify(this.purchaseReturns));
  }

  async getSalesReturns(): Promise<SalesReturn[]> {
    return [...this.salesReturns];
  }

  async getPurchaseReturns(): Promise<PurchaseReturn[]> {
    return [...this.purchaseReturns];
  }

  async getAll(): Promise<any[]> {
    const list: any[] = [];
    this.salesReturns.forEach(sr => {
      list.push({
        id: sr.id,
        type: 'Sales Return',
        originalInvoiceNumber: sr.originalInvoiceNumber,
        customerOrSupplierName: sr.customerName,
        date: sr.date,
        reason: sr.items[0]?.reason || 'Customer Return',
        refundAmount: sr.totalRefundAmount,
        refundMethod: sr.refundMethod,
        restocked: true,
        items: sr.items.map(i => ({
          medicineId: i.medicineId,
          medicineName: i.medicineName,
          batchNumber: i.batchNumber,
          quantity: i.returnQuantity,
          unitPrice: i.unitPrice,
          total: i.refundAmount,
          restockable: true,
          reason: i.reason
        }))
      });
    });
    this.purchaseReturns.forEach(pr => {
      list.push({
        id: pr.id,
        type: 'Purchase Return',
        originalInvoiceNumber: pr.purchaseInvoiceNumber,
        customerOrSupplierName: pr.supplierName,
        date: pr.date,
        reason: pr.items[0]?.reason || 'Supplier Return',
        refundAmount: pr.totalAmount,
        refundMethod: 'Credit Note',
        restocked: false,
        items: pr.items.map(i => ({
          medicineId: i.medicineId,
          medicineName: i.medicineName,
          batchNumber: i.batchNumber,
          quantity: i.quantity,
          unitPrice: i.purchasePrice,
          total: i.totalAmount,
          restockable: false,
          reason: i.reason
        }))
      });
    });
    return list;
  }

  async create(data: any): Promise<any> {
    if (data.type === 'Sales Return') {
      return this.createSalesReturn({
        originalInvoiceNumber: data.originalInvoiceNumber,
        customerName: data.customerOrSupplierName,
        totalRefundAmount: data.refundAmount,
        refundMethod: data.refundMethod,
        processedBy: 'Priya Sharma (R.Ph)',
        items: data.items.map((i: any) => ({
          medicineId: i.medicineId,
          medicineName: i.medicineName,
          batchNumber: i.batchNumber,
          returnQuantity: i.quantity,
          unitPrice: i.unitPrice,
          refundAmount: i.total,
          reason: 'Doctor Changed Rx'
        }))
      });
    } else {
      return this.createPurchaseReturn({
        purchaseInvoiceNumber: data.originalInvoiceNumber,
        supplierId: 'sup-01',
        supplierName: data.customerOrSupplierName,
        totalAmount: data.refundAmount,
        status: 'Approved',
        items: data.items.map((i: any) => ({
          medicineId: i.medicineId,
          medicineName: i.medicineName,
          batchNumber: i.batchNumber,
          quantity: i.quantity,
          purchasePrice: i.unitPrice,
          totalAmount: i.total,
          reason: 'Excess Stock'
        }))
      });
    }
  }

  async createSalesReturn(data: Omit<SalesReturn, 'id' | 'returnNumber' | 'date'>): Promise<SalesReturn> {
    const newReturn: SalesReturn = {
      ...data,
      id: `ret-s-${Date.now()}`,
      returnNumber: `SR-2026-${String(this.salesReturns.length + 2).padStart(3, '0')}`,
      date: new Date().toISOString()
    };

    // Restock returned items
    for (const item of newReturn.items) {
      const med = await medicineService.getById(item.medicineId);
      if (med) {
        const batch = med.batches.find(b => b.batchNumber === item.batchNumber);
        if (batch) {
          await medicineService.addStock(item.medicineId, batch.id, item.returnQuantity);
          await inventoryService.recordMovement({
            medicineId: item.medicineId,
            medicineName: item.medicineName,
            batchNumber: item.batchNumber,
            type: 'Return',
            quantityChange: item.returnQuantity,
            previousStock: batch.quantity - item.returnQuantity,
            newStock: batch.quantity,
            user: newReturn.processedBy,
            referenceId: newReturn.returnNumber,
            notes: `Sales Return: ${item.reason}`
          });
        }
      }
    }

    this.salesReturns.unshift(newReturn);
    this.persist();
    return newReturn;
  }

  async createPurchaseReturn(data: Omit<PurchaseReturn, 'id' | 'returnNumber' | 'date'>): Promise<PurchaseReturn> {
    const newReturn: PurchaseReturn = {
      ...data,
      id: `ret-p-${Date.now()}`,
      returnNumber: `PR-2026-${String(this.purchaseReturns.length + 2).padStart(3, '0')}`,
      date: new Date().toISOString().split('T')[0]
    };

    // Deduct stock for supplier return
    for (const item of newReturn.items) {
      const med = await medicineService.getById(item.medicineId);
      if (med) {
        const batch = med.batches.find(b => b.batchNumber === item.batchNumber);
        if (batch) {
          await medicineService.deductStock(item.medicineId, batch.id, item.quantity);
          await inventoryService.recordMovement({
            medicineId: item.medicineId,
            medicineName: item.medicineName,
            batchNumber: item.batchNumber,
            type: 'Return',
            quantityChange: -item.quantity,
            previousStock: batch.quantity + item.quantity,
            newStock: batch.quantity,
            user: 'Inventory Manager',
            referenceId: newReturn.returnNumber,
            notes: `Purchase Return to Supplier: ${item.reason}`
          });
        }
      }
    }

    this.purchaseReturns.unshift(newReturn);
    this.persist();
    return newReturn;
  }
}

export const returnService = new ReturnService();
