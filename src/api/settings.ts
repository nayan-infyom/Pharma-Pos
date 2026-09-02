import { apiGet, apiPatch } from './client';
import { StoreSettings, POSSettings, InventorySettings } from '../types';

export interface PharmacyConfig {
  store: StoreSettings;
  pos: POSSettings;
  inventory: InventorySettings;
}

export interface UpdateSettingsRequest {
  store?: Partial<StoreSettings>;
  pos?: Partial<POSSettings>;
  inventory?: Partial<InventorySettings>;
}

export async function getSettings(): Promise<PharmacyConfig> {
  return apiGet<PharmacyConfig>('/settings');
}
export async function updateSettings(updates: UpdateSettingsRequest): Promise<PharmacyConfig> {
  return apiPatch<PharmacyConfig>('/settings', updates);
}
