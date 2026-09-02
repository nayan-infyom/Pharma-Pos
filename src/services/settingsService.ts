import { StoreSettings, POSSettings, InventorySettings } from '../types';
import * as settingsApi from '../api/settings';

/**
 * Phase K batch 5: backed by the real API (singleton document) — no
 * parallel localStorage settings database. The old service's flattened
 * `PharmacySettings` view (`.get()`/`.update()`) is dropped: it had two
 * fields (`currency`/`currencySymbol`, `receiptFooterNote`) that were never
 * backed by anything (not even the old localStorage version actually
 * persisted `receiptFooterNote` on update — a pre-existing bug) and a
 * mis-wired "Automated FEFO Expiry Warning" checkbox that actually toggled
 * the unrelated `lowStockThreshold` number. SettingsPage now works with the
 * real nested {store, pos, inventory} shape directly instead of maintaining
 * a second, partially-fictional shape on top of it — see the batch report.
 */
class SettingsService {
  async getStore(): Promise<StoreSettings> {
    return (await settingsApi.getSettings()).store;
  }
  async getPOS(): Promise<POSSettings> {
    return (await settingsApi.getSettings()).pos;
  }
  async getInventory(): Promise<InventorySettings> {
    return (await settingsApi.getSettings()).inventory;
  }
  async getAll(): Promise<settingsApi.PharmacyConfig> {
    return settingsApi.getSettings();
  }

  async updateStore(updates: Partial<StoreSettings>): Promise<StoreSettings> {
    return (await settingsApi.updateSettings({ store: updates })).store;
  }
  async updatePOS(updates: Partial<POSSettings>): Promise<POSSettings> {
    return (await settingsApi.updateSettings({ pos: updates })).pos;
  }
  async updateInventory(updates: Partial<InventorySettings>): Promise<InventorySettings> {
    return (await settingsApi.updateSettings({ inventory: updates })).inventory;
  }
}

export const settingsService = new SettingsService();
