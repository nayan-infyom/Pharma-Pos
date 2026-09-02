import React, { useState, useEffect } from 'react';
import { settingsService } from '../services/settingsService';
import { StoreSettings, POSSettings, InventorySettings } from '../types';
import { ApiError } from '../api/client';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  Building2,
  Printer,
  Receipt,
  Check,
  Loader2
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const SettingsPage: React.FC = () => {
  const { addToast } = useAppStore();
  const [store, setStore] = useState<StoreSettings | null>(null);
  const [pos, setPos] = useState<POSSettings | null>(null);
  const [inventory, setInventory] = useState<InventorySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const config = await settingsService.getAll();
      setStore(config.store);
      setPos(config.pos);
      setInventory(config.inventory);
    } catch (err) {
      setLoadError(
        err instanceof ApiError
          ? (err.code === 'FORBIDDEN' ? "You don't have permission to view store settings." : err.message)
          : 'Failed to load settings.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store || !pos || !inventory || isSaving) return;

    setIsSaving(true);
    try {
      // Server remains the sole authority for how (or whether) any of these
      // fields actually influence business behavior — see the batch report
      // for exactly which are already enforced (requireDoctorNameForRx)
      // versus persisted-only for now (defaultTaxRate, allowNegativeStock,
      // invoicePrefix, and the rest of inventory.*). This form only saves
      // the configured values; it never reimplements what they do.
      const [savedStore, savedPos, savedInventory] = await Promise.all([
        settingsService.updateStore(store),
        settingsService.updatePOS(pos),
        settingsService.updateInventory(inventory)
      ]);
      setStore(savedStore);
      setPos(savedPos);
      setInventory(savedInventory);

      addToast({
        type: 'success',
        title: 'Settings Saved',
        message: 'Store configuration and printer defaults updated.'
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Could Not Save Settings',
        message: err instanceof ApiError ? err.message : 'Failed to save settings.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loadError) {
    return (
      <div className="max-w-5xl mx-auto p-6 text-center text-xs text-rose-600 rounded-xl border border-slate-200 bg-white">
        {loadError}{' '}
        <button className="underline font-semibold" onClick={loadSettings}>Retry</button>
      </div>
    );
  }

  if (isLoading || !store || !pos || !inventory) {
    return (
      <div className="max-w-5xl mx-auto p-10 flex items-center justify-center text-slate-400 rounded-xl border border-slate-200 bg-white">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/80">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Store Profile & Configuration
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure drug licensing, GST tax rules and invoice receipt defaults
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          isLoading={isSaving}
          onClick={handleSave}
          leftIcon={<Check className="w-3.5 h-3.5" />}
        >
          Save Configuration
        </Button>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Pharmacy Legal Profile */}
        <div className="p-4 rounded-xl border border-slate-200/90 bg-white space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <div>
              <h3 className="text-xs font-bold text-slate-900">Pharmacy Store Legal & Tax Profile</h3>
              <p className="text-[11px] text-slate-400">Printed on official tax invoices & customer receipts</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Store Commercial Name"
              value={store.name}
              onChange={(e) => setStore({ ...store, name: e.target.value })}
              required
            />

            <Input
              label="Store Tagline"
              value={store.tagline}
              onChange={(e) => setStore({ ...store, tagline: e.target.value })}
            />

            <Input
              label="GSTIN Tax Identification #"
              value={store.gstin}
              onChange={(e) => setStore({ ...store, gstin: e.target.value })}
            />

            <Input
              label="Drug License (20B) Number"
              value={store.drugLicenseNumber20B}
              onChange={(e) => setStore({ ...store, drugLicenseNumber20B: e.target.value })}
            />

            <Input
              label="Helpline / Contact Phone"
              value={store.phone}
              onChange={(e) => setStore({ ...store, phone: e.target.value })}
            />

            <Input
              label="Official Email"
              value={store.email}
              onChange={(e) => setStore({ ...store, email: e.target.value })}
            />
          </div>

          <Input
            label="Physical Store Address"
            value={store.address}
            onChange={(e) => setStore({ ...store, address: e.target.value })}
          />
        </div>

        {/* POS Billing & Tax Controls */}
        <div className="p-4 rounded-xl border border-slate-200/90 bg-white space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <Receipt className="w-4 h-4 text-teal-600" />
            <div>
              <h3 className="text-xs font-bold text-slate-900">POS Terminal & Tax Defaults</h3>
              <p className="text-[11px] text-slate-400">Default tax rate and rounding rules</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Default GST Tax Rate (%)"
              type="number"
              value={pos.defaultTaxRate}
              onChange={(e) => setPos({ ...pos, defaultTaxRate: parseFloat(e.target.value) || 0 })}
            />

            <Input
              label="Low Stock Alert Threshold (units)"
              type="number"
              value={inventory.lowStockThreshold}
              onChange={(e) => setInventory({ ...inventory, lowStockThreshold: parseInt(e.target.value) || 0 })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer p-3 rounded-lg border border-slate-200/90 bg-slate-50/50">
              <input
                type="checkbox"
                checked={pos.roundOffTotal}
                onChange={(e) => setPos({ ...pos, roundOffTotal: e.target.checked })}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <div>
                <span>Round Off Total to Nearest Rupee</span>
                <p className="text-[11px] text-slate-400 font-normal">Prevents paise change friction at checkout</p>
              </div>
            </label>

            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer p-3 rounded-lg border border-slate-200/90 bg-slate-50/50">
              <input
                type="checkbox"
                checked={pos.requireDoctorNameForRx}
                onChange={(e) => setPos({ ...pos, requireDoctorNameForRx: e.target.checked })}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <div>
                <span>Require Doctor Name for Rx Sales</span>
                <p className="text-[11px] text-slate-400 font-normal">Enforced server-side at checkout, not just a UI hint</p>
              </div>
            </label>
          </div>
        </div>

        {/* Printer & Receipt Template */}
        <div className="p-4 rounded-xl border border-slate-200/90 bg-white space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <Printer className="w-4 h-4 text-purple-600" />
            <div>
              <h3 className="text-xs font-bold text-slate-900">Thermal Printer & Receipt Layout</h3>
              <p className="text-[11px] text-slate-400">Configure slip dimensions</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Default Receipt Format
              </label>
              <select
                value={pos.thermalReceiptWidth}
                onChange={(e) => setPos({ ...pos, thermalReceiptWidth: e.target.value as POSSettings['thermalReceiptWidth'] })}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold"
              >
                <option value="58mm">58mm POS Thermal Slip</option>
                <option value="80mm">80mm POS Thermal Slip (ESC/POS)</option>
                <option value="A4">Standard A4 Full Page Tax Invoice</option>
              </select>
            </div>

            <Input
              label="Invoice Prefix Code"
              value={pos.invoicePrefix}
              onChange={(e) => setPos({ ...pos, invoicePrefix: e.target.value })}
            />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isSaving}
            leftIcon={<Check className="w-3.5 h-3.5" />}
          >
            Save All Changes
          </Button>
        </div>
      </form>
    </div>
  );
};
