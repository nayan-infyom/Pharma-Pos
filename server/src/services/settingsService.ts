import { Settings, SettingsDoc, SETTINGS_SINGLETON_ID } from '../models/Settings.model';
import { UpdateSettingsBody } from '../validators/settings.validators';

/**
 * Default values mirror the original frontend's src/data/settings.ts
 * seed exactly (same receipt/store details already shown on every invoice —
 * "do not silently change existing defaults"). Used only to auto-provision
 * the singleton on first read; the Settings.model.ts schema's own bare
 * defaults (e.g. invoicePrefix: 'INV-') are a fallback of last resort, not
 * what actually ships.
 */
const DEFAULT_SETTINGS = {
  _id: SETTINGS_SINGLETON_ID,
  store: {
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
  },
  pos: {
    defaultTaxRate: 12,
    invoicePrefix: 'INV-2026-',
    thermalReceiptWidth: '80mm' as const,
    autoPrintReceipt: true,
    enableSoundEffects: true,
    enableFEFOSuggestion: true,
    allowNegativeStock: false,
    requireDoctorNameForRx: true,
    roundOffTotal: true
  },
  inventory: {
    lowStockThreshold: 20,
    criticalStockThreshold: 5,
    expiryWarningDays: 90,
    criticalExpiryDays: 30,
    enforceFEFO: true,
    autoReorderAlerts: true
  }
};

export async function getSettings(): Promise<SettingsDoc> {
  const existing = await Settings.findById(SETTINGS_SINGLETON_ID);
  if (existing) return existing;
  // findOneAndUpdate+upsert rather than a plain create() — concurrency-safe
  // if two requests both race to auto-provision the singleton on first read.
  return Settings.findOneAndUpdate({ _id: SETTINGS_SINGLETON_ID }, { $setOnInsert: DEFAULT_SETTINGS }, { upsert: true, new: true });
}

export async function updateSettings(updates: UpdateSettingsBody): Promise<SettingsDoc> {
  const settings = await getSettings();
  if (updates.store) Object.assign(settings.store, updates.store);
  if (updates.pos) Object.assign(settings.pos, updates.pos);
  if (updates.inventory) Object.assign(settings.inventory, updates.inventory);
  await settings.save();
  return settings;
}
