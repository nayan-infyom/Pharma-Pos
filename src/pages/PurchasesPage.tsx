import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { purchaseService } from '../services/purchaseService';
import { supplierService } from '../services/supplierService';
import { medicineService } from '../services/medicineService';
import { PurchaseOrder, Supplier, Medicine, PurchaseOrderItem } from '../types';
import { ApiError } from '../api/client';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import {
  Search,
  Plus,
  Eye,
  Trash2,
  Loader2
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { formatINR, formatDate } from '../utils/formatters';

export const PurchasesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useAppStore();

  const [purchases, setPurchases] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Create PO modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  // New PO form state. Backend status values are 'Ordered' | 'Received' |
  // 'Cancelled' (no 'Pending') — the form keeps the old "Pending" label for
  // an unreceived draft PO but the underlying value is 'Ordered'.
  const [poSupplierId, setPoSupplierId] = useState('');
  const [poInvoiceNo, setPoInvoiceNo] = useState('');
  const [poOrderDate, setPoOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [poExpectedDate, setPoExpectedDate] = useState('');
  const [poStatus, setPoStatus] = useState<'Ordered' | 'Received'>('Received');
  const [poItems, setPoItems] = useState<PurchaseOrderItem[]>([]);

  // Item row helper
  const [selectedMedId, setSelectedMedId] = useState('');
  const [itemBatchNo, setItemBatchNo] = useState('');
  const [itemExpiry, setItemExpiry] = useState('2028-06-30');
  const [itemMfg, setItemMfg] = useState('2026-01-01');
  const [itemQty, setItemQty] = useState('100');
  const [itemFreeQty, setItemFreeQty] = useState('0');
  const [itemPurchasePrice, setItemPurchasePrice] = useState('120.00');
  const [itemMrp, setItemMrp] = useState('190.00');
  const [itemSellingPrice, setItemSellingPrice] = useState('175.00');
  const [itemGst, setItemGst] = useState('12');

  useEffect(() => {
    loadData();
    const action = searchParams.get('action');
    const medId = searchParams.get('medId');
    if (action === 'new') {
      setIsCreateOpen(true);
      if (medId) {
        setSelectedMedId(medId);
      }
      setSearchParams({});
    }
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [purchList, supList, medList] = await Promise.all([
        purchaseService.getAll(),
        supplierService.getAll(),
        medicineService.getAll()
      ]);
      setPurchases(purchList);
      setSuppliers(supList);
      setMedicines(medList);
      if (supList.length > 0) setPoSupplierId(supList[0].id);

      const initialMedId = searchParams.get('medId') || (medList.length > 0 ? medList[0].id : '');
      if (initialMedId) {
        setSelectedMedId(initialMedId);
        const found = medList.find(m => m.id === initialMedId);
        if (found) {
          setItemPurchasePrice(found.purchasePrice.toString());
          setItemMrp(found.mrp.toString());
          setItemSellingPrice(found.sellingPrice.toString());
          setItemGst(found.gstRate.toString());
        }
      }
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Failed to load purchases data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPoItem = () => {
    const med = medicines.find(m => m.id === selectedMedId);
    if (!med || !itemBatchNo.trim()) {
      addToast({
        type: 'error',
        title: 'Missing Details',
        message: 'Please select a medicine and enter a valid batch number.'
      });
      return;
    }

    const qty = parseInt(itemQty) || 1;
    const freeQty = parseInt(itemFreeQty) || 0;
    const pPrice = parseFloat(itemPurchasePrice) || 0;
    const mrp = parseFloat(itemMrp) || 0;
    const sellingPrice = parseFloat(itemSellingPrice) || 0;
    const gstRate = parseFloat(itemGst) || 12;

    if (sellingPrice > mrp) {
      addToast({
        type: 'error',
        title: 'Invalid Selling Price',
        message: 'Selling price cannot exceed MRP.'
      });
      return;
    }

    // Locally computed for the pre-submission preview table only — the
    // server recomputes tax/total authoritatively from purchasePrice/
    // discountPercent/taxRate when the PO is actually submitted (see
    // purchaseService.create / server purchaseService.ts computeLineCharge).
    const subtotal = qty * pPrice;
    const taxAmount = (subtotal * gstRate) / 100;
    const total = subtotal + taxAmount;

    const newItem: PurchaseOrderItem = {
      medicineId: med.id,
      medicineName: med.name,
      batchNumber: itemBatchNo.toUpperCase().trim(),
      expiryDate: itemExpiry,
      mfgDate: itemMfg,
      quantity: qty,
      freeQuantity: freeQty,
      purchasePrice: pPrice,
      mrp,
      sellingPrice,
      discountPercent: 0,
      taxRate: gstRate,
      taxAmount,
      total
    };

    setPoItems([...poItems, newItem]);
    setItemBatchNo('');
    addToast({
      type: 'info',
      title: 'Batch Added',
      message: `${med.name} (${newItem.batchNumber}) added.`
    });
  };

  const handleRemovePoItem = (index: number) => {
    setPoItems(poItems.filter((_, i) => i !== index));
  };

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (poItems.length === 0) {
      addToast({
        type: 'error',
        title: 'Empty Purchase Order',
        message: 'Please add at least one medicine item to the PO.'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Server recomputes taxAmount/total/subtotal/taxTotal/grandTotal/
      // paymentStatus itself (see purchaseService.ts) — only the raw inputs
      // per line are sent, not this page's local preview figures.
      const created = await purchaseService.create({
        invoiceNumber: poInvoiceNo.trim() || `PINV-${Date.now().toString().slice(-6)}`,
        supplierId: poSupplierId,
        orderDate: poOrderDate,
        expectedDeliveryDate: poExpectedDate || undefined,
        status: poStatus,
        items: poItems.map((item) => ({
          medicineId: item.medicineId,
          medicineName: item.medicineName,
          batchNumber: item.batchNumber,
          mfgDate: item.mfgDate,
          expiryDate: item.expiryDate,
          quantity: item.quantity,
          freeQuantity: item.freeQuantity,
          purchasePrice: item.purchasePrice,
          mrp: item.mrp,
          sellingPrice: item.sellingPrice,
          taxRate: item.taxRate,
          discountPercent: item.discountPercent
        })),
        paidAmount: 0,
        notes: 'Inward shipment processed by inventory department'
      });

      addToast({
        type: 'success',
        title: 'Purchase Order Saved',
        message: `${created.invoiceNumber} recorded.${created.status === 'Received' ? ' Stock automatically updated.' : ''}`
      });

      setIsCreateOpen(false);
      setPoItems([]);
      setPoInvoiceNo('');
      loadData();
    } catch (err) {
      const isDuplicateInvoice = err instanceof ApiError && err.code === 'DUPLICATE_RESOURCE';
      addToast({
        type: 'error',
        title: isDuplicateInvoice ? 'Duplicate Supplier Invoice' : 'Purchase Order Not Saved',
        message: isDuplicateInvoice
          ? 'This supplier invoice number has already been recorded — check the Purchases list before re-entering it.'
          : err instanceof ApiError
            ? err.message
            : 'Failed to save the purchase order.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPurchases = purchases.filter(p => {
    const q = (searchQuery || '').toLowerCase().trim();
    const matchesSearch =
      !q ||
      (p.invoiceNumber || '').toLowerCase().includes(q) ||
      (p.supplierName || '').toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalInwardValue = filteredPurchases.reduce((sum, p) => sum + p.grandTotal, 0);

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Purchases & Inward Goods
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Log wholesale distributor shipments, register inward drug batches and verify payables
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          onClick={() => setIsCreateOpen(true)}
        >
          New Inward Purchase
        </Button>
      </div>

      {/* Overview Stat Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Total Inward Value</span>
          <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
            {formatINR(totalInwardValue)}
          </div>
          <span className="text-[11px] text-slate-400">{filteredPurchases.length} Purchase Invoices</span>
        </div>

        <div className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Registered Wholesalers</span>
          <div className="text-lg font-bold font-mono text-teal-700 mt-0.5">
            {suppliers.length} Distributors
          </div>
          <span className="text-[11px] text-slate-400">Authorized Pharma Stockists</span>
        </div>

        <div className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Shipments Received</span>
          <div className="text-lg font-bold font-mono text-emerald-700 mt-0.5">
            {purchases.filter(p => p.status === 'Received').length} Received
          </div>
          <span className="text-[11px] text-slate-400">Stock reflected on shelves</span>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="p-3 rounded-xl border border-slate-200 bg-white shadow-2xs flex flex-col sm:flex-row gap-2.5">
        <div className="flex-1">
          <Input
            placeholder="Search PO #, supplier name, invoice number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            className="text-xs"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700"
        >
          <option value="All">All Inward Statuses</option>
          <option value="Received">Received (Stock Added)</option>
          <option value="Ordered">Pending Delivery</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Purchases Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
        {loadError ? (
          <div className="p-6 text-center text-xs text-rose-600">
            {loadError}{' '}
            <button className="underline font-semibold" onClick={loadData}>Retry</button>
          </div>
        ) : isLoading ? (
          <div className="p-10 flex items-center justify-center text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : filteredPurchases.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-400">No purchase orders match your search.</div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3.5 font-semibold">PO / Invoice #</th>
                <th className="py-2.5 px-3.5 font-semibold">Wholesale Supplier</th>
                <th className="py-2.5 px-3.5 font-semibold">Order Date</th>
                <th className="py-2.5 px-3.5 font-semibold">Status</th>
                <th className="py-2.5 px-3.5 font-semibold">Payment</th>
                <th className="py-2.5 px-3.5 font-semibold text-right">Batches</th>
                <th className="py-2.5 px-3.5 font-semibold text-right">Grand Total</th>
                <th className="py-2.5 px-3.5 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPurchases.map((po) => (
                <tr key={po.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3.5 font-mono font-semibold text-slate-900">
                    {po.invoiceNumber}
                  </td>
                  <td className="py-2.5 px-3.5">
                    <div className="font-semibold text-slate-900">{po.supplierName}</div>
                  </td>
                  <td className="py-2.5 px-3.5 font-mono text-slate-500">{formatDate(po.orderDate)}</td>
                  <td className="py-2.5 px-3.5">
                    <Badge variant={po.status === 'Received' ? 'success' : po.status === 'Cancelled' ? 'danger' : 'warning'} size="sm">
                      {po.status}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3.5">
                    <Badge variant={po.paymentStatus === 'Paid' ? 'success' : 'danger'} size="sm">
                      {po.paymentStatus}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-mono">{po.items.length}</td>
                  <td className="py-2.5 px-3.5 text-right font-mono font-bold text-slate-900">
                    {formatINR(po.grandTotal)}
                  </td>
                  <td className="py-2.5 px-3.5 text-center">
                    <Button
                      variant="ghost"
                      size="xs"
                      leftIcon={<Eye className="w-3.5 h-3.5" />}
                      onClick={() => setSelectedPO(po)}
                    >
                      Inspect
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* New Purchase Inward Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Record Inward Purchase Shipment"
        description="Inward drug batches will automatically update warehouse stock & FEFO queue."
        maxWidth="3xl"
      >
        <form onSubmit={handleCreatePO} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Wholesale Supplier
              </label>
              <select
                value={poSupplierId}
                onChange={(e) => setPoSupplierId(e.target.value)}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700"
                required
              >
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <Input
              label="Supplier Invoice #"
              placeholder="e.g. INV-99214"
              value={poInvoiceNo}
              onChange={(e) => setPoInvoiceNo(e.target.value)}
              required
            />

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Inward Status
              </label>
              <select
                value={poStatus}
                onChange={(e) => setPoStatus(e.target.value as 'Ordered' | 'Received')}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700"
              >
                <option value="Received">Received (Add Stock Now)</option>
                <option value="Ordered">Pending (Draft PO)</option>
              </select>
            </div>
          </div>

          {/* Add Item Form Bar */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2.5">
            <h4 className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-emerald-600" /> Add Medicine Batch
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="col-span-2">
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Drug Item</label>
                <select
                  value={selectedMedId}
                  onChange={(e) => setSelectedMedId(e.target.value)}
                  className="w-full h-8 px-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-700"
                >
                  {medicines.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.strength})</option>
                  ))}
                </select>
              </div>

              <Input
                label="Batch #"
                placeholder="e.g. BAT-01"
                value={itemBatchNo}
                onChange={(e) => setItemBatchNo(e.target.value)}
                className="h-8 text-xs font-mono"
              />

              <Input
                label="Expiry Date"
                type="date"
                value={itemExpiry}
                onChange={(e) => setItemExpiry(e.target.value)}
                className="h-8 text-xs font-mono"
              />

              <Input
                label="Quantity"
                type="number"
                value={itemQty}
                onChange={(e) => setItemQty(e.target.value)}
                className="h-8 text-xs font-mono"
              />

              <Input
                label="Free Qty"
                type="number"
                value={itemFreeQty}
                onChange={(e) => setItemFreeQty(e.target.value)}
                className="h-8 text-xs font-mono"
              />

              <Input
                label="Purchase Rate (₹)"
                type="number"
                step="any"
                value={itemPurchasePrice}
                onChange={(e) => setItemPurchasePrice(e.target.value)}
                className="h-8 text-xs font-mono"
              />

              <Input
                label="MRP (₹)"
                type="number"
                step="any"
                value={itemMrp}
                onChange={(e) => setItemMrp(e.target.value)}
                className="h-8 text-xs font-mono"
              />

              <Input
                label="Selling Price (₹)"
                type="number"
                step="any"
                value={itemSellingPrice}
                onChange={(e) => setItemSellingPrice(e.target.value)}
                className="h-8 text-xs font-mono"
              />
            </div>

            <div className="flex justify-end pt-1">
              <Button
                type="button"
                variant="secondary"
                size="xs"
                onClick={handleAddPoItem}
              >
                + Add Batch Row
              </Button>
            </div>
          </div>

          {/* PO Items Table */}
          {poItems.length > 0 && (
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-2 px-3">Medicine</th>
                    <th className="py-2 px-3">Batch</th>
                    <th className="py-2 px-3">Exp Date</th>
                    <th className="py-2 px-3 text-right">Qty</th>
                    <th className="py-2 px-3 text-right">Rate</th>
                    <th className="py-2 px-3 text-right">Total</th>
                    <th className="py-2 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {poItems.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-3 font-semibold">{item.medicineName}</td>
                      <td className="py-2 px-3 font-mono">{item.batchNumber}</td>
                      <td className="py-2 px-3 font-mono">{item.expiryDate}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold">
                        {item.quantity} {item.freeQuantity ? `(+${item.freeQuantity})` : ''}
                      </td>
                      <td className="py-2 px-3 text-right font-mono">{formatINR(item.purchasePrice)}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold">{formatINR(item.total)}</td>
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemovePoItem(idx)}
                          className="p-1 text-rose-600 hover:text-rose-800 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <div className="text-xs text-slate-500">
              Total Inward Items: <span className="font-semibold">{poItems.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                Save & Inward Stock
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Inspect PO Modal */}
      {selectedPO && (
        <Modal
          isOpen={!!selectedPO}
          onClose={() => setSelectedPO(null)}
          title={`Purchase Order: ${selectedPO.invoiceNumber}`}
          description={`Supplier: ${selectedPO.supplierName} • Date: ${formatDate(selectedPO.orderDate)}`}
          maxWidth="lg"
        >
          <div className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
              <div>
                <span className="text-slate-500">Supplier Name:</span>
                <p className="font-semibold text-slate-900">{selectedPO.supplierName}</p>
              </div>
              <div>
                <span className="text-slate-500">Delivery Status:</span>
                <div className="mt-0.5"><Badge variant={selectedPO.status === 'Received' ? 'success' : selectedPO.status === 'Cancelled' ? 'danger' : 'warning'} size="sm">{selectedPO.status}</Badge></div>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 font-semibold text-slate-600">
                  <tr>
                    <th className="py-2 px-3">Item</th>
                    <th className="py-2 px-3">Batch</th>
                    <th className="py-2 px-3">Expiry</th>
                    <th className="py-2 px-3 text-right">Qty</th>
                    <th className="py-2 px-3 text-right">Rate</th>
                    <th className="py-2 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedPO.items.map((item, i) => (
                    <tr key={i}>
                      <td className="py-2 px-3 font-semibold">{item.medicineName}</td>
                      <td className="py-2 px-3 font-mono">{item.batchNumber}</td>
                      <td className="py-2 px-3 font-mono">{item.expiryDate}</td>
                      <td className="py-2 px-3 text-right font-bold">{item.quantity}</td>
                      <td className="py-2 px-3 text-right font-mono">{formatINR(item.purchasePrice)}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold">{formatINR(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center text-xs border-t border-slate-200 pt-2">
              <span className="text-slate-500">Tax Breakdown: {formatINR(selectedPO.taxTotal)}</span>
              <span className="text-sm font-bold text-slate-900">Grand Total: {formatINR(selectedPO.grandTotal)}</span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
