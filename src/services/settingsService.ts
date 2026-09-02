import { StoreSettings, POSSettings, InventorySettings } from '../types';
import { initialStoreSettings, initialPOSSettings, initialInventorySettings } from '../data/settings';

const STORE_KEY = 'pharmapos_store_settings_v1';
const POS_KEY = 'pharmapos_pos_settings_v1';
const INV_KEY = 'pharmapos_inv_settings_v1';

class SettingsService {
  private store: StoreSettings;
  private pos: POSSettings;
  private inventory: InventorySettings;

  constructor() {
    const s = localStorage.getItem(STORE_KEY);
    this.store = s ? JSON.parse(s) : initialStoreSettings;

    const p = localStorage.getItem(POS_KEY);
    this.pos = p ? JSON.parse(p) : initialPOSSettings;

    const i = localStorage.getItem(INV_KEY);
    this.inventory = i ? JSON.parse(i) : initialInventorySettings;
  }

  async getStore(): Promise<StoreSettings> {
    return { ...this.store };
  }

  async getPOS(): Promise<POSSettings> {
    return { ...this.pos };
  }

  async getInventory(): Promise<InventorySettings> {
    return { ...this.inventory };
  }

  async updateStore(updates: Partial<StoreSettings>): Promise<StoreSettings> {
    this.store = { ...this.store, ...updates };
    localStorage.setItem(STORE_KEY, JSON.stringify(this.store));
    return { ...this.store };
  }

  async updatePOS(updates: Partial<POSSettings>): Promise<POSSettings> {
    this.pos = { ...this.pos, ...updates };
    localStorage.setItem(POS_KEY, JSON.stringify(this.pos));
    return { ...this.pos };
  }

  async updateInventory(updates: Partial<InventorySettings>): Promise<InventorySettings> {
    this.inventory = { ...this.inventory, ...updates };
    localStorage.setItem(INV_KEY, JSON.stringify(this.inventory));
    return { ...this.inventory };
  }

  async get(): Promise<any> {
    return {
      pharmacyName: this.store.name,
      tagline: this.store.tagline,
      address: `${this.store.address}, ${this.store.city}, ${this.store.state}`,
      phone: this.store.phone,
      email: this.store.email,
      gstin: this.store.gstin,
      drugLicenseNumber: this.store.drugLicenseNumber20B,
      currency: 'USD',
      currencySymbol: '$',
      taxRateDefault: this.pos.defaultTaxRate,
      roundOffGrandTotal: this.pos.roundOffTotal,
      lowStockAlertThreshold: this.inventory.lowStockThreshold,
      receiptType: this.pos.thermalReceiptWidth === 'A4' ? 'a4' : 'thermal',
      invoicePrefix: this.pos.invoicePrefix,
      receiptFooterNote: 'Thank you for choosing Apex Care Pharmacy!'
    };
  }

  async update(settings: any): Promise<any> {
    this.store.name = settings.pharmacyName || this.store.name;
    this.store.tagline = settings.tagline || this.store.tagline;
    this.store.address = settings.address || this.store.address;
    this.store.phone = settings.phone || this.store.phone;
    this.store.email = settings.email || this.store.email;
    this.store.gstin = settings.gstin || this.store.gstin;
    this.pos.defaultTaxRate = settings.taxRateDefault || this.pos.defaultTaxRate;
    this.pos.roundOffTotal = settings.roundOffGrandTotal ?? this.pos.roundOffTotal;
    this.pos.invoicePrefix = settings.invoicePrefix || this.pos.invoicePrefix;
    this.inventory.lowStockThreshold = settings.lowStockAlertThreshold || this.inventory.lowStockThreshold;

    localStorage.setItem(STORE_KEY, JSON.stringify(this.store));
    localStorage.setItem(POS_KEY, JSON.stringify(this.pos));
    localStorage.setItem(INV_KEY, JSON.stringify(this.inventory));
    return this.get();
  }

  async resetToDemoData(): Promise<void> {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('pharmapos_')) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  }
}

export const settingsService = new SettingsService();
