import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { returnService } from '../services/returnService';
import { salesService } from '../services/salesService';
import { ReturnRecord, SaleInvoice, ReturnItem } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { 
  Search, 
  Plus
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { formatINR, formatDate } from '../utils/formatters';

export const ReturnsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { addToast } = useAppStore();

  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [, setSales] = useState<SaleInvoice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Return creation form
  const [returnType, setReturnType] = useState<'Sales Return' | 'Purchase Return'>('Sales Return');
  const [refInvoiceNo, setRefInvoiceNo] = useState('');
  const [customerSupplierName, setCustomerSupplierName] = useState('');
  const [returnReason, setReturnReason] = useState('Doctor changed prescription regimen');
  const [refundMethod, setRefundMethod] = useState<'Cash' | 'Credit Note' | 'Original Method'>('Cash');
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);

  useEffect(() => {
    loadData();
    const invParam = searchParams.get('invoice');
    if (invParam) {
      setRefInvoiceNo(invParam);
      setIsCreateOpen(true);
      autoFillFromInvoice(invParam);
    }
  }, []);

  const loadData = async () => {
    const [retList, salesList] = await Promise.all([
      returnService.getAll(),
      salesService.getAll()
    ]);
    setReturns(retList);
    setSales(salesList);
  };

  const autoFillFromInvoice = async (invNumber: string) => {
    const sale = await salesService.getByInvoiceNumber(invNumber);
    if (sale) {
      setCustomerSupplierName(sale.customerName);
      setReturnItems(
        sale.items.map(item => ({
          medicineId: item.medicineId,
          medicineName: item.medicineName,
          batchId: item.batchId,
          batchNumber: item.batchNumber,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
          restockable: true,
          reason: 'Customer return'
        }))
      );
    }
  };

  const handleCreateReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (returnItems.length === 0) {
      addToast({
        type: 'error',
        title: 'Empty Return',
        message: 'Please add items to be returned.'
      });
      return;
    }

    const totalRefund = returnItems.reduce((sum, i) => sum + i.total, 0);

    const created = await returnService.create({
      type: returnType,
      originalInvoiceNumber: refInvoiceNo.trim() || `INV-${Date.now().toString().slice(-6)}`,
      customerOrSupplierName: customerSupplierName.trim() || 'Customer Return',
      date: new Date().toISOString(),
      reason: returnReason,
      refundAmount: totalRefund,
      refundMethod,
      items: returnItems,
      restocked: returnItems.some(i => i.restockable)
    });

    addToast({
      type: 'success',
      title: 'Return Processed',
      message: `Return ${created.id} recorded. Stock & refunds adjusted.`
    });

    setIsCreateOpen(false);
    setReturnItems([]);
    setRefInvoiceNo('');
    loadData();
  };

  const filteredReturns = returns.filter(r => {
    const q = (searchQuery || '').toLowerCase().trim();
    const matchesSearch =
      !q ||
      (r.id || '').toLowerCase().includes(q) ||
      (r.originalInvoiceNumber || '').toLowerCase().includes(q) ||
      (r.customerOrSupplierName || '').toLowerCase().includes(q);
    const matchesType = typeFilter === 'All' || r.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalRefunded = filteredReturns.reduce((sum, r) => sum + r.refundAmount, 0);

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Returns, Credit Notes & Refunds
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Process patient sales returns, issue credit notes and handle supplier returns
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          onClick={() => setIsCreateOpen(true)}
        >
          Process Return
        </Button>
      </div>

      {/* Overview Stat Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Processed Returns</span>
          <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
            {returns.length} records
          </div>
          <span className="text-[11px] text-slate-400">Sales & supplier returns</span>
        </div>

        <div className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Refund Value Disbursed</span>
          <div className="text-lg font-bold font-mono text-rose-600 mt-0.5">
            {formatINR(totalRefunded)}
          </div>
          <span className="text-[11px] text-slate-400">Credited or cash refunded</span>
        </div>

        <div className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Inventory Sync</span>
          <div className="text-lg font-bold font-mono text-emerald-700 mt-0.5">
            FEFO Synced
          </div>
          <span className="text-[11px] text-slate-400">Eligible stock restored to shelf</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-3 rounded-xl border border-slate-200 bg-white shadow-2xs flex flex-col sm:flex-row gap-2.5">
        <div className="flex-1">
          <Input
            placeholder="Search return ID, invoice #, customer name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            className="text-xs"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700"
        >
          <option value="All">All Return Types</option>
          <option value="Sales Return">Patient Sales Return</option>
          <option value="Purchase Return">Wholesale Supplier Return</option>
        </select>
      </div>

      {/* Returns Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3.5 font-semibold">Return ID</th>
                <th className="py-2.5 px-3.5 font-semibold">Original Invoice #</th>
                <th className="py-2.5 px-3.5 font-semibold">Party Name</th>
                <th className="py-2.5 px-3.5 font-semibold">Type</th>
                <th className="py-2.5 px-3.5 font-semibold">Reason</th>
                <th className="py-2.5 px-3.5 font-semibold">Refund Mode</th>
                <th className="py-2.5 px-3.5 font-semibold text-right">Refund Amount</th>
                <th className="py-2.5 px-3.5 font-semibold text-center">Restocked</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReturns.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3.5 font-mono font-semibold text-slate-900">
                    {r.id}
                  </td>
                  <td className="py-2.5 px-3.5 font-mono text-slate-500">{r.originalInvoiceNumber}</td>
                  <td className="py-2.5 px-3.5 font-semibold text-slate-900">
                    {r.customerOrSupplierName}
                  </td>
                  <td className="py-2.5 px-3.5">
                    <Badge variant={r.type === 'Sales Return' ? 'info' : 'warning'} size="sm">
                      {r.type}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3.5 text-slate-600 max-w-xs truncate">
                    {r.reason}
                  </td>
                  <td className="py-2.5 px-3.5">
                    <Badge variant="default" size="sm">{r.refundMethod}</Badge>
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-mono font-bold text-rose-600">
                    {formatINR(r.refundAmount)}
                  </td>
                  <td className="py-2.5 px-3.5 text-center">
                    <Badge variant={r.restocked ? 'success' : 'danger'} size="sm">
                      {r.restocked ? 'Restocked' : 'Discarded'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Process Return Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Process Return & Refund"
        description="Issue credit note, cash refund and adjust batch stock levels"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateReturn} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Return Type</label>
              <select
                value={returnType}
                onChange={(e) => setReturnType(e.target.value as any)}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700"
              >
                <option value="Sales Return">Patient Sales Return</option>
                <option value="Purchase Return">Wholesale Supplier Return</option>
              </select>
            </div>

            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input
                  label="Original Invoice #"
                  placeholder="e.g. INV-202608-001"
                  value={refInvoiceNo}
                  onChange={(e) => setRefInvoiceNo(e.target.value)}
                  required
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-9"
                onClick={() => autoFillFromInvoice(refInvoiceNo)}
              >
                Lookup
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Customer / Supplier Name"
              placeholder="e.g. Rajesh Kumar"
              value={customerSupplierName}
              onChange={(e) => setCustomerSupplierName(e.target.value)}
              required
            />

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Refund Method</label>
              <select
                value={refundMethod}
                onChange={(e) => setRefundMethod(e.target.value as any)}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700"
              >
                <option value="Cash">Cash Refund</option>
                <option value="Credit Note">Credit Note (Khata)</option>
                <option value="Original Method">Original Payment Method</option>
              </select>
            </div>
          </div>

          <Input
            label="Reason for Return"
            placeholder="e.g. Physician changed prescription dosage after 2 days"
            value={returnReason}
            onChange={(e) => setReturnReason(e.target.value)}
            required
          />

          {/* Returned Items List */}
          {returnItems.length > 0 && (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 font-semibold text-slate-600">
                  <tr>
                    <th className="py-2 px-3">Medicine</th>
                    <th className="py-2 px-3">Batch</th>
                    <th className="py-2 px-3 text-right">Qty</th>
                    <th className="py-2 px-3 text-right">Refund Total</th>
                    <th className="py-2 px-3 text-center">Restock?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {returnItems.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-3 font-semibold">{item.medicineName}</td>
                      <td className="py-2 px-3 font-mono">{item.batchNumber}</td>
                      <td className="py-2 px-3 text-right font-bold">{item.quantity}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-rose-600">
                        {formatINR(item.total)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={item.restockable}
                          onChange={(e) => {
                            const next = [...returnItems];
                            next[idx].restockable = e.target.checked;
                            setReturnItems(next);
                          }}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <div className="text-xs font-mono font-bold">
              Total Refund: {formatINR(returnItems.reduce((sum, i) => sum + i.total, 0))}
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Confirm Return & Disburse
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
