import { PurchaseOrder } from '../types';

export const initialPurchases: PurchaseOrder[] = [
  {
    id: 'po-2026-001',
    invoiceNumber: 'MED-IN-8892',
    supplierId: 'sup-01',
    supplierName: 'MedLife Pharma Distributors',
    orderDate: '2026-08-25',
    deliveryDate: '2026-08-27',
    items: [
      {
        medicineId: 'med-01',
        medicineName: 'Augmentin 625 Duo',
        batchNumber: 'AUG24K09',
        mfgDate: '2024-04-10',
        expiryDate: '2027-03-31',
        quantity: 100,
        freeQuantity: 10,
        purchasePrice: 145.0,
        mrp: 204.5,
        taxRate: 12,
        taxAmount: 1740.0,
        discountPercent: 3,
        total: 15805.0
      },
      {
        medicineId: 'med-08',
        medicineName: 'Becosules Z Capsules',
        batchNumber: 'PFZ-BCZ-19',
        mfgDate: '2025-01-10',
        expiryDate: '2027-12-31',
        quantity: 200,
        freeQuantity: 20,
        purchasePrice: 36.0,
        mrp: 52.5,
        taxRate: 18,
        taxAmount: 1296.0,
        discountPercent: 2,
        total: 8352.0
      }
    ],
    subtotal: 21700.0,
    taxTotal: 3036.0,
    discountTotal: 579.0,
    grandTotal: 24157.0,
    paymentStatus: 'Paid',
    paidAmount: 24157.0,
    status: 'Received',
    notes: 'Standard monthly stock replenishment'
  },
  {
    id: 'po-2026-002',
    invoiceNumber: 'APO-WH-4410',
    supplierId: 'sup-02',
    supplierName: 'Apollo Wholesale Logistics',
    orderDate: '2026-08-28',
    deliveryDate: '2026-08-30',
    items: [
      {
        medicineId: 'med-02',
        medicineName: 'Dolo 650',
        batchNumber: 'DL65-980',
        mfgDate: '2025-01-05',
        expiryDate: '2028-12-31',
        quantity: 300,
        freeQuantity: 30,
        purchasePrice: 22.5,
        mrp: 34.0,
        taxRate: 12,
        taxAmount: 810.0,
        discountPercent: 5,
        total: 7222.5
      },
      {
        medicineId: 'med-16',
        medicineName: 'Refresh Tears Eye Drops',
        batchNumber: 'ALN-RF82',
        mfgDate: '2025-01-10',
        expiryDate: '2027-12-31',
        quantity: 50,
        freeQuantity: 5,
        purchasePrice: 115.0,
        mrp: 175.0,
        taxRate: 12,
        taxAmount: 690.0,
        discountPercent: 4,
        total: 6210.0
      }
    ],
    subtotal: 12500.0,
    taxTotal: 1500.0,
    discountTotal: 567.5,
    grandTotal: 13432.5,
    paymentStatus: 'Pending',
    paidAmount: 0.0,
    status: 'Received',
    notes: 'Fast-moving analgesic & ophthalmic restock'
  },
  {
    id: 'po-2026-003',
    invoiceNumber: 'CIP-DIR-9122',
    supplierId: 'sup-04',
    supplierName: 'Cipla & Glenmark Hub',
    orderDate: '2026-08-30',
    deliveryDate: '2026-09-02',
    items: [
      {
        medicineId: 'med-17',
        medicineName: 'Seroflo 250 Synchrobreathe Inhaler',
        batchNumber: 'CIP-SER19',
        mfgDate: '2025-02-15',
        expiryDate: '2027-08-31',
        quantity: 25,
        freeQuantity: 2,
        purchasePrice: 590.0,
        mrp: 875.0,
        taxRate: 12,
        taxAmount: 1770.0,
        discountPercent: 5,
        total: 15782.5
      },
      {
        medicineId: 'med-07',
        medicineName: 'Montair-LC',
        batchNumber: 'MNT-431',
        mfgDate: '2024-09-01',
        expiryDate: '2027-08-31',
        quantity: 50,
        freeQuantity: 5,
        purchasePrice: 180.0,
        mrp: 285.0,
        taxRate: 12,
        taxAmount: 1080.0,
        discountPercent: 5,
        total: 9630.0
      }
    ],
    subtotal: 23750.0,
    taxTotal: 2850.0,
    discountTotal: 1187.5,
    grandTotal: 25412.5,
    paymentStatus: 'Pending',
    paidAmount: 0.0,
    status: 'Ordered',
    notes: 'Urgent restocking for low inventory inhalers'
  }
];
