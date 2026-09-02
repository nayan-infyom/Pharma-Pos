import React, { useState, useEffect } from 'react';
import { settingsService } from '../services/settingsService';
import { PharmacySettings } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { 
  Building2, 
  Printer, 
  Receipt, 
  Database, 
  RefreshCw, 
  Download, 
  Check
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const SettingsPage: React.FC = () => {
  const { addToast } = useAppStore();
  const [settings, setSettings] = useState<PharmacySettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const s = await settingsService.get();
    setSettings(s);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setIsSaving(true);
    await settingsService.update(settings);
    setIsSaving(false);

    addToast({
      type: 'success',
      title: 'Settings Saved',
      message: 'Store configuration and printer defaults updated.'
    });
  };

  const handleExportBackup = () => {
    const fullBackup: { [key: string]: any } = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('pharmapos_')) {
        try {
          fullBackup[key] = JSON.parse(localStorage.getItem(key) || 'null');
        } catch {
          fullBackup[key] = localStorage.getItem(key);
        }
      }
    }

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `pharmapos_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    addToast({
      type: 'success',
      title: 'Backup Downloaded',
      message: 'Complete offline snapshot saved to disk.'
    });
  };

  const handleResetData = async () => {
    if (window.confirm('Are you sure you want to reset all data back to initial demo seeds? Any custom entered records will be replaced.')) {
      await settingsService.resetToDemoData();
      addToast({
        type: 'info',
        title: 'Demo Data Restored',
        message: 'System database restored to fresh seed state.'
      });
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  if (!settings) return null;

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Store Profile & Configuration
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure drug licensing, GST tax rules, invoice receipt headers and database backups
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
        <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">Pharmacy Store Legal & Tax Profile</h3>
              <p className="text-[11px] text-slate-400">Printed on official tax invoices & customer receipts</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Store Commercial Name"
              value={settings.pharmacyName}
              onChange={(e) => setSettings({ ...settings, pharmacyName: e.target.value })}
              required
            />

            <Input
              label="Store Tagline"
              value={settings.tagline}
              onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
            />

            <Input
              label="GSTIN Tax Identification #"
              value={settings.gstin}
              onChange={(e) => setSettings({ ...settings, gstin: e.target.value })}
            />

            <Input
              label="Drug License (DL) Number"
              value={settings.drugLicenseNumber}
              onChange={(e) => setSettings({ ...settings, drugLicenseNumber: e.target.value })}
            />

            <Input
              label="Helpline / Contact Phone"
              value={settings.phone}
              onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
            />

            <Input
              label="Official Email"
              value={settings.email}
              onChange={(e) => setSettings({ ...settings, email: e.target.value })}
            />
          </div>

          <Input
            label="Physical Store Address"
            value={settings.address}
            onChange={(e) => setSettings({ ...settings, address: e.target.value })}
          />
        </div>

        {/* POS Billing & Tax Controls */}
        <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <Receipt className="w-4 h-4 text-teal-600" />
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">POS Terminal & Tax Defaults</h3>
              <p className="text-[11px] text-slate-400">Default tax rates, currency symbol & rounding rules</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Currency Code"
              value={settings.currency}
              onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
            />

            <Input
              label="Currency Symbol"
              value={settings.currencySymbol}
              onChange={(e) => setSettings({ ...settings, currencySymbol: e.target.value })}
            />

            <Input
              label="Default GST Tax Rate (%)"
              type="number"
              value={settings.taxRateDefault}
              onChange={(e) => setSettings({ ...settings, taxRateDefault: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer p-3 rounded-lg border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <input
                type="checkbox"
                checked={settings.roundOffGrandTotal}
                onChange={(e) => setSettings({ ...settings, roundOffGrandTotal: e.target.checked })}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <div>
                <span>Round Off Total to Nearest Rupee</span>
                <p className="text-[11px] text-slate-400 font-normal">Prevents paise change friction at checkout</p>
              </div>
            </label>

            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer p-3 rounded-lg border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <input
                type="checkbox"
                checked={settings.lowStockAlertThreshold > 0}
                onChange={(e) => setSettings({ ...settings, lowStockAlertThreshold: e.target.checked ? 15 : 0 })}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <div>
                <span>Automated FEFO Expiry Warning</span>
                <p className="text-[11px] text-slate-400 font-normal">Alert cashiers if batch expires within 90 days</p>
              </div>
            </label>
          </div>
        </div>

        {/* Printer & Receipt Template */}
        <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <Printer className="w-4 h-4 text-purple-600" />
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">Thermal Printer & Receipt Layout</h3>
              <p className="text-[11px] text-slate-400">Configure slip dimensions and disclaimer text</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Default Receipt Format
              </label>
              <select
                value={settings.receiptType}
                onChange={(e) => setSettings({ ...settings, receiptType: e.target.value as any })}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold"
              >
                <option value="thermal">80mm POS Thermal Slip (ESC/POS)</option>
                <option value="a4">Standard A4 Full Page Tax Invoice</option>
              </select>
            </div>

            <Input
              label="Invoice Prefix Code"
              value={settings.invoicePrefix}
              onChange={(e) => setSettings({ ...settings, invoicePrefix: e.target.value })}
            />
          </div>

          <Input
            label="Receipt Footer Disclaimer / Terms"
            value={settings.receiptFooterNote}
            onChange={(e) => setSettings({ ...settings, receiptFooterNote: e.target.value })}
          />
        </div>

        {/* Local Persistence & Backup */}
        <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <Database className="w-4 h-4 text-amber-600" />
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">Data Management & Backup</h3>
              <p className="text-[11px] text-slate-400">Export database JSON snapshots or restore original demo catalog</p>
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            All pharmacy records, medicines, customers, batches, and sales invoices are persisted in your browser's isolated local storage sandbox with instant offline capability.
          </p>

          <div className="flex flex-wrap gap-2.5 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<Download className="w-3.5 h-3.5" />}
              onClick={handleExportBackup}
            >
              Export JSON Backup
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              leftIcon={<RefreshCw className="w-3.5 h-3.5 text-rose-600" />}
              onClick={handleResetData}
            >
              Reset to Demo Seeds
            </Button>
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
