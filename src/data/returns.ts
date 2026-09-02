import { SalesReturn, PurchaseReturn } from '../types';

export const initialSalesReturns: SalesReturn[] = [
  {
    id: 'ret-s-001',
    returnNumber: 'SR-2026-001',
    originalInvoiceNumber: 'INV-2026-0988',
    customerId: 'cust-06',
    customerName: 'Manish Chawla',
    date: '2026-08-29T14:20:00Z',
    items: [
      {
        medicineId: 'med-04',
        medicineName: 'Azithral 500',
        batchNumber: 'AZT-8821',
        returnQuantity: 1,
        unitPrice: 122.0,
        refundAmount: 122.0,
        reason: 'Doctor Changed Rx'
      }
    ],
    totalRefundAmount: 122.0,
    refundMethod: 'Cash',
    processedBy: 'Priya Sharma (R.Ph)',
    notes: 'Physician switched to alternative cephalosporin.'
  }
];

export const initialPurchaseReturns: PurchaseReturn[] = [
  {
    id: 'ret-p-001',
    returnNumber: 'PR-2026-001',
    purchaseInvoiceNumber: 'MED-IN-8820',
    supplierId: 'sup-01',
    supplierName: 'MedLife Pharma Distributors',
    date: '2026-08-24',
    items: [
      {
        medicineId: 'med-01',
        medicineName: 'Augmentin 625 Duo',
        batchNumber: 'AUG23J04',
        quantity: 10,
        purchasePrice: 142.0,
        totalAmount: 1420.0,
        reason: 'Near Expiry Received'
      }
    ],
    totalAmount: 1420.0,
    status: 'Adjusted',
    notes: 'Credit note CN-8829 received from MedLife.'
  }
];
