import { StoreSettings, POSSettings, InventorySettings } from '../types';

export const initialStoreSettings: StoreSettings = {
  name: 'Apex Care Pharmacy & Surgical Hub',
  tagline: 'Trusted Prescription Dispensing & Healthcare Partner',
  address: 'Shop 14-16, Ground Floor, MediCentre Galleria, Ring Road',
  city: 'Bengaluru',
  state: 'Karnataka',
  pincode: '560034',
  phone: '+91 80 4455 6677',
  email: 'care@apexpharma.com',
  gstin: '29AABCA1234F1Z5',
  drugLicenseNumber20B: 'KA-B1-20B-184920',
  drugLicenseNumber21B: 'KA-B1-21B-184921',
  fssaiNumber: '11223344556677'
};

export const initialPOSSettings: POSSettings = {
  defaultTaxRate: 12,
  invoicePrefix: 'INV-2026-',
  thermalReceiptWidth: '80mm',
  autoPrintReceipt: true,
  enableSoundEffects: true,
  enableFEFOSuggestion: true,
  allowNegativeStock: false,
  requireDoctorNameForRx: true,
  roundOffTotal: true
};

export const initialInventorySettings: InventorySettings = {
  lowStockThreshold: 20,
  criticalStockThreshold: 5,
  expiryWarningDays: 90,
  criticalExpiryDays: 30,
  enforceFEFO: true,
  autoReorderAlerts: true
};
