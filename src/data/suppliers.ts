import { Supplier } from '../types';

export const initialSuppliers: Supplier[] = [
  {
    id: 'sup-01',
    name: 'MedLife Pharma Distributors',
    contactPerson: 'Vikram Mehta',
    phone: '9820011223',
    email: 'orders@medlifepharma.com',
    address: 'Warehouse 4B, Industrial Estate, Phase II',
    gstin: '27AAECM4455P1Z8',
    drugLicense: 'DL-20B-MH-44912 / DL-21B-MH-44913',
    creditDays: 30,
    outstandingAmount: 24500.0,
    totalPurchases: 248000.0,
    status: 'Active'
  },
  {
    id: 'sup-02',
    name: 'Apollo Wholesale Logistics',
    contactPerson: 'Suresh Raina',
    phone: '9840033445',
    email: 'b2b@apollowholesale.in',
    address: 'Plot 18, Central Logistics Park',
    gstin: '33AABCA8899K1Z4',
    drugLicense: 'DL-20B-TN-99211 / DL-21B-TN-99212',
    creditDays: 45,
    outstandingAmount: 18200.0,
    totalPurchases: 385000.0,
    status: 'Active'
  },
  {
    id: 'sup-03',
    name: 'SunPharma Direct Supply',
    contactPerson: 'Rajesh Kulkarni',
    phone: '9833344556',
    email: 'direct.sales@sunpharma.hub',
    address: 'Sun Towers, Bio Park Road',
    gstin: '24AAACS1122D1Z0',
    drugLicense: 'DL-20B-GJ-11224 / DL-21B-GJ-11225',
    creditDays: 21,
    outstandingAmount: 0,
    totalPurchases: 195000.0,
    status: 'Active'
  },
  {
    id: 'sup-04',
    name: 'Cipla & Glenmark Hub',
    contactPerson: 'Amitabh Sen',
    phone: '9819988776',
    email: 'orders@ciplaglenmarkhub.com',
    address: 'Apex Pharma Complex, Block C',
    gstin: '27AAACG9988H1Z1',
    drugLicense: 'DL-20B-MH-77341 / DL-21B-MH-77342',
    creditDays: 30,
    outstandingAmount: 12400.0,
    totalPurchases: 310000.0,
    status: 'Active'
  },
  {
    id: 'sup-05',
    name: 'ColdChain Express Logistics',
    contactPerson: 'Deepak Nair',
    phone: '9845566778',
    email: 'tempcare@coldchainexpress.com',
    address: 'Refrigerated Logistics Bay 3, Airport Cargo Road',
    gstin: '29AAACC7788M1Z9',
    drugLicense: 'DL-20B-KA-55410 / DL-21B-KA-55411',
    creditDays: 15,
    outstandingAmount: 8900.0,
    totalPurchases: 142000.0,
    status: 'Active'
  }
];
