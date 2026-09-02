import { Expense } from '../types';

export const initialExpenses: Expense[] = [
  {
    id: 'exp-01',
    title: 'Vaccine & Insulin Cold Storage Electricity',
    category: 'Cold Chain Electricity',
    amount: 3200.0,
    date: '2026-08-30',
    paymentMethod: 'Bank Transfer',
    addedBy: 'Admin (Dr. Mehta)',
    receiptNumber: 'REC-EB-9921',
    notes: '24/7 Temperature backup line electricity bill'
  },
  {
    id: 'exp-02',
    title: 'Bio-Hazardous Drug Disposal Service',
    category: 'Bio-Waste Disposal',
    amount: 1450.0,
    date: '2026-08-28',
    paymentMethod: 'UPI',
    addedBy: 'Priya Sharma (R.Ph)',
    receiptNumber: 'BW-5520',
    notes: 'Safe incinerator disposal of broken glass ampoules & expired chemicals'
  },
  {
    id: 'exp-03',
    title: 'Thermal Paper Rolls & Pharmacy Carry Bags',
    category: 'Packaging & Stationery',
    amount: 980.0,
    date: '2026-08-26',
    paymentMethod: 'Cash',
    addedBy: 'Rohan Verma',
    receiptNumber: 'STAT-104',
    notes: '20 rolls of 80mm thermal rolls + 500 paper bags'
  },
  {
    id: 'exp-04',
    title: 'Pharmacy License & Software Annual Audit',
    category: 'Software & Subscriptions',
    amount: 4500.0,
    date: '2026-08-15',
    paymentMethod: 'Card',
    addedBy: 'Admin (Dr. Mehta)',
    receiptNumber: 'INV-SFT-881',
    notes: 'Pharma cloud compliance & drug database updates'
  },
  {
    id: 'exp-05',
    title: 'Store Air Conditioning Servicing',
    category: 'Maintenance',
    amount: 1800.0,
    date: '2026-08-10',
    paymentMethod: 'UPI',
    addedBy: 'Admin (Dr. Mehta)',
    receiptNumber: 'AC-SRV-441',
    notes: 'Compressor clean and filter replacement to maintain under 25°C store temp'
  }
];
