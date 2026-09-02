import { StockMovement } from '../types';

export const initialStockMovements: StockMovement[] = [
  {
    id: 'mov-01',
    date: '2026-08-31T11:20:00Z',
    medicineId: 'med-01',
    medicineName: 'Augmentin 625 Duo',
    batchNumber: 'AUG24K09',
    type: 'Sale',
    quantityChange: -5,
    previousStock: 85,
    newStock: 80,
    user: 'Priya Sharma (R.Ph)',
    referenceId: 'INV-2026-1003',
    notes: 'POS Sale to Dr. Arvind Swaminathan'
  },
  {
    id: 'mov-02',
    date: '2026-08-31T10:45:00Z',
    medicineId: 'med-02',
    medicineName: 'Dolo 650',
    batchNumber: 'DL65-980',
    type: 'Sale',
    quantityChange: -1,
    previousStock: 201,
    newStock: 200,
    user: 'Rohan Verma',
    referenceId: 'INV-2026-1002',
    notes: 'POS Counter Sale'
  },
  {
    id: 'mov-03',
    date: '2026-08-30T15:00:00Z',
    medicineId: 'med-02',
    medicineName: 'Dolo 650',
    batchNumber: 'DL65-980',
    type: 'Purchase',
    quantityChange: 300,
    previousStock: 21,
    newStock: 321,
    user: 'Kavita Joshi',
    referenceId: 'APO-WH-4410',
    notes: 'Inward shipment received from Apollo Wholesale'
  },
  {
    id: 'mov-04',
    date: '2026-08-29T14:20:00Z',
    medicineId: 'med-04',
    medicineName: 'Azithral 500',
    batchNumber: 'AZT-8821',
    type: 'Return',
    quantityChange: 1,
    previousStock: 94,
    newStock: 95,
    user: 'Priya Sharma (R.Ph)',
    referenceId: 'SR-2026-001',
    notes: 'Sales return by customer Manish Chawla'
  },
  {
    id: 'mov-05',
    date: '2026-08-28T16:10:00Z',
    medicineId: 'med-03',
    medicineName: 'Pan-D Capsule',
    batchNumber: 'PAND-402',
    type: 'Adjustment',
    quantityChange: -2,
    previousStock: 20,
    newStock: 18,
    user: 'Dr. Sameer Mehta',
    referenceId: 'ADJ-8819',
    notes: 'Audit adjustment - Damaged blister pack discarded'
  },
  {
    id: 'mov-06',
    date: '2026-08-27T12:00:00Z',
    medicineId: 'med-01',
    medicineName: 'Augmentin 625 Duo',
    batchNumber: 'AUG24K09',
    type: 'Purchase',
    quantityChange: 100,
    previousStock: 45,
    newStock: 145,
    user: 'Kavita Joshi',
    referenceId: 'MED-IN-8892',
    notes: 'Inward shipment from MedLife Pharma'
  }
];
