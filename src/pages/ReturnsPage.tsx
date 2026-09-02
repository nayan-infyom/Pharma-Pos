import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { returnService } from '../services/returnService';
import { salesService } from '../services/salesService';
import { purchaseService } from '../services/purchaseService';
import { CombinedReturnRow, SalesReturn, PurchaseReturn, SaleInvoice, PurchaseOrder, SalesReturnReason, PurchaseReturnReason } from '../types';
import { ApiError, Pagination as PaginationMeta } from '../api/client';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Drawer } from '../components/ui/Drawer';
import { Pagination } from '../components/ui/Pagination';
import {
  Search,
  Plus,
  FileText,
  Loader2
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { formatINR, formatDate } from '../utils/formatters';

const PAGE_SIZE = 25;
const SALES_RETURN_REASONS: SalesReturnReason[] = ['Damaged Packaging', 'Wrong Dosage', 'Doctor Changed Rx', 'Adverse Reaction', 'Patient Recovered', 'Other'];
const PURCHASE_RETURN_REASONS: PurchaseReturnReason[] = ['Near Expiry Received', 'Damaged in Transit', 'Excess Stock', 'Rate Discrepancy'];

interface ReturnLineDraft {
  medicineId: string;
  medicineName: string;
  batchNumber: string;
  maxQty: number;
  returnQty: number;
  reason: string;
}

export const ReturnsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { addToast } = useAppStore();

  const [returns, setReturns] = useState<CombinedReturnRow[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Sales Return' | 'Purchase Return'>('All');

  const [selectedDetail, setSelectedDetail] = useState<{ type: 'Sales Return'; data: SalesReturn } | { type: 'Purchase Return'; data: PurchaseReturn } | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Return creation form — the original sale/purchase order is looked up by
  // invoice # (no dedicated backend endpoint for this; same client-side
  // filter-over-capped-list pattern as salesService.getByInvoiceNumber) and
  // its ORIGINAL line snapshot drives what can be returned. The server
  // still authoritatively recomputes refund/debit amounts and enforces the
  // cumulative-already-returned cap — this is only a UI convenience bound.
  const [returnType, setReturnType] = useState<'Sales Return' | 'Purchase Return'>('Sales Return');
  const [lookupInvoice, setLookupInvoice] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [originalSale, setOriginalSale] = useState<SaleInvoice | null>(null);
  const [originalPurchase, setOriginalPurchase] = useState<PurchaseOrder | null>(null);
  const [returnLines, setReturnLines] = useState<ReturnLineDraft[]>([]);
  const [refundMethod, setRefundMethod] = useState<'Cash' | 'Credit Note' | 'Original Payment'>('Cash');
  const [poReturnStatus, setPoReturnStatus] = useState<'Pending' | 'Approved' | 'Adjusted'>('Approved');
  const [returnNotes, setReturnNotes] = useState('');

  useEffect(() => {
    loadReturns(1);
    const invParam = searchParams.get('invoice');
    if (invParam) {
      setLookupInvoice(invParam);
      setIsCreateOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadReturns = async (targetPage: number) => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const { items, pagination: p } = await returnService.listCombined(targetPage, PAGE_SIZE);
      setReturns(items);
      setPagination(p);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Failed to load returns.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetCreateForm = () => {
    setLookupInvoice('');
    setOriginalSale(null);
    setOriginalPurchase(null);
    setReturnLines([]);
    setReturnNotes('');
    setRefundMethod('Cash');
    setPoReturnStatus('Approved');
  };

  const handleReturnTypeChange = (type: 'Sales Return' | 'Purchase Return') => {
    setReturnType(type);
    resetCreateForm();
  };

  const handleLookup = async () => {
    const invNum = lookupInvoice.trim();
    if (!invNum || isLookingUp) return;
    setIsLookingUp(true);
    try {
      if (returnType === 'Sales Return') {
        const sale = await salesService.getByInvoiceNumber(invNum);
        if (!sale) {
          addToast({ type: 'error', title: 'Invoice Not Found', message: `No sale found with invoice number "${invNum}".` });
          return;
        }
        setOriginalSale(sale);
        setOriginalPurchase(null);
        setReturnLines(
          sale.items.map((i) => ({
            medicineId: i.medicineId,
            medicineName: i.medicineName,
            batchNumber: i.batchNumber,
            maxQty: i.quantity,
            returnQty: 0,
            reason: SALES_RETURN_REASONS[0]
          }))
        );
      } else {
        const po = await purchaseService.getByInvoiceNumber(invNum);
        if (!po) {
          addToast({ type: 'error', title: 'Invoice Not Found', message: `No purchase order found with invoice number "${invNum}".` });
          return;
        }
        setOriginalPurchase(po);
        setOriginalSale(null);
        setReturnLines(
          po.items.map((i) => ({
            medicineId: i.medicineId,
            medicineName: i.medicineName,
            batchNumber: i.batchNumber,
            maxQty: i.quantity + i.freeQuantity,
            returnQty: 0,
            reason: PURCHASE_RETURN_REASONS[0]
          }))
        );
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Lookup Failed', message: err instanceof ApiError ? err.message : 'Failed to look up the original invoice.' });
    } finally {
      setIsLookingUp(false);
    }
  };

  const updateLineQty = (idx: number, qty: number) => {
    setReturnLines((lines) => lines.map((l, i) => (i === idx ? { ...l, returnQty: Math.max(0, Math.min(qty, l.maxQty)) } : l)));
  };

  const updateLineReason = (idx: number, reason: string) => {
    setReturnLines((lines) => lines.map((l, i) => (i === idx ? { ...l, reason } : l)));
  };

  const handleCreateReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    const linesToSubmit = returnLines.filter((l) => l.returnQty > 0);
    if (linesToSubmit.length === 0) {
      addToast({ type: 'error', title: 'Nothing to Return', message: 'Enter a return quantity greater than 0 for at least one item.' });
      return;
    }

    setIsSubmitting(true);
    try {
      if (returnType === 'Sales Return') {
        if (!originalSale) return;
        const created = await returnService.createSalesReturn({
          originalSaleId: originalSale.id,
          items: linesToSubmit.map((l) => ({ medicineId: l.medicineId, batchNumber: l.batchNumber, returnQuantity: l.returnQty, reason: l.reason as SalesReturnReason })),
          refundMethod,
          notes: returnNotes || undefined
        });
        addToast({
          type: 'success',
          title: 'Sales Return Processed',
          message: `${created.returnNumber} recorded — ${formatINR(created.totalRefundAmount)} refunded via ${created.refundMethod}. Stock restocked.`
        });
      } else {
        if (!originalPurchase) return;
        const created = await returnService.createPurchaseReturn({
          purchaseOrderId: originalPurchase.id,
          items: linesToSubmit.map((l) => ({ medicineId: l.medicineId, batchNumber: l.batchNumber, quantity: l.returnQty, reason: l.reason as PurchaseReturnReason })),
          status: poReturnStatus,
          notes: returnNotes || undefined
        });
        addToast({
          type: 'success',
          title: 'Purchase Return Processed',
          message: `${created.returnNumber} recorded — ${formatINR(created.totalAmount)} debited against ${created.supplierName}. Stock deducted.`
        });
      }

      setIsCreateOpen(false);
      resetCreateForm();
      setPage(1);
      loadReturns(1);
    } catch (err) {
      // Surfaces the server's cumulative-return-quantity validation message
      // verbatim (e.g. "Cannot return 5 ... only 3 already returned") rather
      // than recomputing that check client-side.
      addToast({
        type: 'error',
        title: 'Return Not Processed',
        message: err instanceof ApiError ? err.message : 'Failed to process the return.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDetail = async (row: CombinedReturnRow) => {
    setIsDetailLoading(true);
    try {
      if (row.type === 'Sales Return') {
        const data = await returnService.getSalesReturnById(row.id);
        if (data) setSelectedDetail({ type: 'Sales Return', data });
      } else {
        const data = await returnService.getPurchaseReturnById(row.id);
        if (data) setSelectedDetail({ type: 'Purchase Return', data });
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Could Not Load Return', message: err instanceof ApiError ? err.message : 'Failed to load return details.' });
    } finally {
      setIsDetailLoading(false);
    }
  };

  // Type/text filters refine the current server-paginated page only — no
  // dedicated combined-search endpoint exists (same documented pattern as
  // Prescriptions' free-text search).
  const filteredReturns = returns.filter((r) => {
    const q = (searchQuery || '').toLowerCase().trim();
    const matchesSearch =
      !q ||
      r.returnNumber.toLowerCase().includes(q) ||
      r.referenceInvoiceNumber.toLowerCase().includes(q) ||
      r.partyName.toLowerCase().includes(q);
    const matchesType = typeFilter === 'All' || r.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalRefunded = filteredReturns.reduce((sum, r) => sum + r.amount, 0);

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
            {pagination?.total ?? returns.length} records
          </div>
          <span className="text-[11px] text-slate-400">Sales & supplier returns</span>
        </div>

        <div className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Refund Value (this page)</span>
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
            placeholder="Search return #, invoice #, party name (current page)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            className="text-xs"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as 'All' | 'Sales Return' | 'Purchase Return')}
          className="h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700"
        >
          <option value="All">All Return Types</option>
          <option value="Sales Return">Patient Sales Return</option>
          <option value="Purchase Return">Wholesale Supplier Return</option>
        </select>
      </div>

      {/* Returns Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
        {loadError ? (
          <div className="p-6 text-center text-xs text-rose-600">
            {loadError}{' '}
            <button className="underline font-semibold" onClick={() => loadReturns(page)}>Retry</button>
          </div>
        ) : isLoading ? (
          <div className="p-10 flex items-center justify-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin" /></div>
        ) : filteredReturns.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-400">No returns match your search.</div>
        ) : (
        <>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3.5 font-semibold">Return #</th>
                <th className="py-2.5 px-3.5 font-semibold">Reference Invoice #</th>
                <th className="py-2.5 px-3.5 font-semibold">Party Name</th>
                <th className="py-2.5 px-3.5 font-semibold">Type</th>
                <th className="py-2.5 px-3.5 font-semibold">Date</th>
                <th className="py-2.5 px-3.5 font-semibold text-right">Amount</th>
                <th className="py-2.5 px-3.5 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReturns.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3.5 font-mono font-semibold text-slate-900">
                    {r.returnNumber}
                  </td>
                  <td className="py-2.5 px-3.5 font-mono text-slate-500">{r.referenceInvoiceNumber}</td>
                  <td className="py-2.5 px-3.5 font-semibold text-slate-900">
                    {r.partyName}
                  </td>
                  <td className="py-2.5 px-3.5">
                    <Badge variant={r.type === 'Sales Return' ? 'info' : 'warning'} size="sm">
                      {r.type}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3.5 font-mono text-slate-500">{formatDate(r.date)}</td>
                  <td className="py-2.5 px-3.5 text-right font-mono font-bold text-rose-600">
                    {formatINR(r.amount)}
                  </td>
                  <td className="py-2.5 px-3.5 text-center">
                    <Button variant="ghost" size="xs" leftIcon={<FileText className="w-3.5 h-3.5" />} onClick={() => openDetail(r)}>
                      Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pagination && <Pagination pagination={pagination} onPageChange={(p) => { setPage(p); loadReturns(p); }} itemLabel="returns" />}
        </>
        )}
      </div>

      {/* Return Detail Drawer */}
      {(selectedDetail || isDetailLoading) && (
        <Drawer
          isOpen={!!selectedDetail || isDetailLoading}
          onClose={() => setSelectedDetail(null)}
          title={selectedDetail ? selectedDetail.data.returnNumber : 'Loading…'}
          description={selectedDetail?.type === 'Sales Return' ? `Customer: ${selectedDetail.data.customerName}` : selectedDetail ? `Supplier: ${selectedDetail.data.supplierName}` : undefined}
          width="lg"
        >
          {isDetailLoading || !selectedDetail ? (
            <div className="p-6 flex justify-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin" /></div>
          ) : selectedDetail.type === 'Sales Return' ? (
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg grid grid-cols-2 gap-2">
                <div><span className="text-slate-500">Original Invoice:</span> <span className="font-mono font-semibold text-slate-900">{selectedDetail.data.originalInvoiceNumber}</span></div>
                <div><span className="text-slate-500">Refund Method:</span> <Badge variant="default" size="sm">{selectedDetail.data.refundMethod}</Badge></div>
                <div><span className="text-slate-500">Date:</span> <span className="font-semibold text-slate-900">{formatDate(selectedDetail.data.date)}</span></div>
                <div><span className="text-slate-500">Total Refund:</span> <span className="font-mono font-bold text-rose-600">{formatINR(selectedDetail.data.totalRefundAmount)}</span></div>
              </div>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 font-semibold text-slate-600">
                    <tr><th className="py-2 px-3">Medicine</th><th className="py-2 px-3">Batch</th><th className="py-2 px-3 text-right">Qty</th><th className="py-2 px-3 text-right">Refund</th><th className="py-2 px-3">Reason</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedDetail.data.items.map((item, i) => (
                      <tr key={i}>
                        <td className="py-2 px-3 font-semibold">{item.medicineName}</td>
                        <td className="py-2 px-3 font-mono">{item.batchNumber}</td>
                        <td className="py-2 px-3 text-right font-bold">{item.returnQuantity}</td>
                        <td className="py-2 px-3 text-right font-mono">{formatINR(item.refundAmount)}</td>
                        <td className="py-2 px-3">{item.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {selectedDetail.data.notes && <p className="text-slate-500">Notes: {selectedDetail.data.notes}</p>}
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg grid grid-cols-2 gap-2">
                <div><span className="text-slate-500">Original PO Invoice:</span> <span className="font-mono font-semibold text-slate-900">{selectedDetail.data.purchaseInvoiceNumber}</span></div>
                <div><span className="text-slate-500">Status:</span> <Badge variant="default" size="sm">{selectedDetail.data.status}</Badge></div>
                <div><span className="text-slate-500">Date:</span> <span className="font-semibold text-slate-900">{formatDate(selectedDetail.data.date)}</span></div>
                <div><span className="text-slate-500">Total Debit:</span> <span className="font-mono font-bold text-rose-600">{formatINR(selectedDetail.data.totalAmount)}</span></div>
              </div>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 font-semibold text-slate-600">
                    <tr><th className="py-2 px-3">Medicine</th><th className="py-2 px-3">Batch</th><th className="py-2 px-3 text-right">Qty</th><th className="py-2 px-3 text-right">Debit</th><th className="py-2 px-3">Reason</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedDetail.data.items.map((item, i) => (
                      <tr key={i}>
                        <td className="py-2 px-3 font-semibold">{item.medicineName}</td>
                        <td className="py-2 px-3 font-mono">{item.batchNumber}</td>
                        <td className="py-2 px-3 text-right font-bold">{item.quantity}</td>
                        <td className="py-2 px-3 text-right font-mono">{formatINR(item.totalAmount)}</td>
                        <td className="py-2 px-3">{item.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {selectedDetail.data.notes && <p className="text-slate-500">Notes: {selectedDetail.data.notes}</p>}
            </div>
          )}
        </Drawer>
      )}

      {/* Process Return Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => { setIsCreateOpen(false); resetCreateForm(); }}
        title="Process Return & Refund"
        description="Look up the original invoice — refund/debit amounts are computed from its actual recorded prices"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateReturn} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Return Type</label>
              <select
                value={returnType}
                onChange={(e) => handleReturnTypeChange(e.target.value as 'Sales Return' | 'Purchase Return')}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700"
              >
                <option value="Sales Return">Patient Sales Return</option>
                <option value="Purchase Return">Wholesale Supplier Return</option>
              </select>
            </div>

            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input
                  label={returnType === 'Sales Return' ? 'Original Sale Invoice #' : 'Original Purchase Invoice #'}
                  placeholder="e.g. INV-2026-1"
                  value={lookupInvoice}
                  onChange={(e) => setLookupInvoice(e.target.value)}
                  required
                />
              </div>
              <Button type="button" variant="secondary" size="sm" className="h-9" onClick={handleLookup} isLoading={isLookingUp}>
                Lookup
              </Button>
            </div>
          </div>

          {(originalSale || originalPurchase) && (
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
              Found: {originalSale ? `${originalSale.invoiceNumber} — ${originalSale.customerName}` : `${originalPurchase!.invoiceNumber} — ${originalPurchase!.supplierName}`}
            </div>
          )}

          {returnType === 'Sales Return' ? (
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Refund Method</label>
              <select
                value={refundMethod}
                onChange={(e) => setRefundMethod(e.target.value as 'Cash' | 'Credit Note' | 'Original Payment')}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700"
              >
                <option value="Cash">Cash Refund</option>
                <option value="Credit Note">Credit Note (Khata)</option>
                <option value="Original Payment">Original Payment Method</option>
              </select>
            </div>
          ) : (
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Return Status</label>
              <select
                value={poReturnStatus}
                onChange={(e) => setPoReturnStatus(e.target.value as 'Pending' | 'Approved' | 'Adjusted')}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700"
              >
                <option value="Approved">Approved</option>
                <option value="Pending">Pending</option>
                <option value="Adjusted">Adjusted</option>
              </select>
            </div>
          )}

          <Input
            label="Notes (Optional)"
            placeholder="e.g. Physician changed prescription dosage after 2 days"
            value={returnNotes}
            onChange={(e) => setReturnNotes(e.target.value)}
          />

          {/* Returnable Items List */}
          {returnLines.length > 0 && (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 font-semibold text-slate-600">
                  <tr>
                    <th className="py-2 px-3">Medicine</th>
                    <th className="py-2 px-3">Batch</th>
                    <th className="py-2 px-3 text-right">{returnType === 'Sales Return' ? 'Sold Qty' : 'Received Qty'}</th>
                    <th className="py-2 px-3 text-right">Return Qty</th>
                    <th className="py-2 px-3">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {returnLines.map((line, idx) => (
                    <tr key={`${line.medicineId}-${line.batchNumber}`}>
                      <td className="py-2 px-3 font-semibold">{line.medicineName}</td>
                      <td className="py-2 px-3 font-mono">{line.batchNumber}</td>
                      <td className="py-2 px-3 text-right font-mono">{line.maxQty}</td>
                      <td className="py-2 px-3 text-right">
                        <input
                          type="number"
                          min={0}
                          max={line.maxQty}
                          value={line.returnQty}
                          onChange={(e) => updateLineQty(idx, parseInt(e.target.value) || 0)}
                          className="w-16 h-7 px-2 text-right font-mono border border-slate-200 rounded"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <select
                          value={line.reason}
                          onChange={(e) => updateLineReason(idx, e.target.value)}
                          className="h-7 px-1.5 border border-slate-200 rounded text-xs"
                        >
                          {(returnType === 'Sales Return' ? SALES_RETURN_REASONS : PURCHASE_RETURN_REASONS).map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <div className="text-xs text-slate-500">
              Server computes the exact refund/debit amount from the original recorded prices.
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => { setIsCreateOpen(false); resetCreateForm(); }} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting} disabled={returnLines.length === 0}>
                Confirm Return & Disburse
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
