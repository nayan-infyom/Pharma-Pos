import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supplierService } from '../services/supplierService';
import { Supplier, SupplierLedgerEntry } from '../types';
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
  Loader2,
  BookOpen
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { formatINR, formatDateTime } from '../utils/formatters';

const PAGE_SIZE = 20;

export const SuppliersPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useAppStore();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Stat-strip aggregate — separate capped read, same reasoning as CustomersPage.
  const [statsSuppliers, setStatsSuppliers] = useState<Supplier[]>([]);

  const [isNewSupplierOpen, setIsNewSupplierOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<SupplierLedgerEntry[]>([]);
  const [ledgerPagination, setLedgerPagination] = useState<PaginationMeta | null>(null);
  const [isLedgerLoading, setIsLedgerLoading] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [payAmount, setPayAmount] = useState('0');
  const [payMethod, setPayMethod] = useState<'Cash' | 'UPI' | 'Card' | 'Bank Transfer'>('Bank Transfer');

  // New supplier form
  const [supName, setSupName] = useState('');
  const [supContact, setSupContact] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supGstin, setSupGstin] = useState('');
  const [supDl, setSupDl] = useState('');
  const [supAddress, setSupAddress] = useState('');

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setIsNewSupplierOpen(true);
      setSearchParams({});
    }
    supplierService.getAll().then(setStatsSuppliers).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadSuppliers(page, searchQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const loadSuppliers = async (targetPage: number, search: string) => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const { items, pagination: p } = await supplierService.list({ search: search || undefined, page: targetPage, limit: PAGE_SIZE });
      setSuppliers(items);
      setPagination(p);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Failed to load suppliers.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setPage(1);
      loadSuppliers(1, val);
    }, 300);
  };

  const loadLedger = async (supplierId: string, targetPage: number) => {
    setIsLedgerLoading(true);
    try {
      const { items, pagination: p } = await supplierService.getLedger(supplierId, targetPage, 10);
      setLedgerEntries(items);
      setLedgerPagination(p);
    } catch {
      setLedgerEntries([]);
      setLedgerPagination(null);
    } finally {
      setIsLedgerLoading(false);
    }
  };

  const openLedger = (s: Supplier) => {
    setSelectedSupplier(s);
    loadLedger(s.id, 1);
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreating) return;
    if (!supName.trim() || !supPhone.trim()) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Supplier name and contact phone are required.'
      });
      return;
    }

    setIsCreating(true);
    try {
      const created = await supplierService.create({
        name: supName.trim(),
        contactPerson: supContact.trim() || undefined,
        phone: supPhone.trim(),
        email: supEmail.trim() || undefined,
        gstin: supGstin.trim() || undefined,
        drugLicenseNumber: supDl.trim() || undefined,
        drugLicense: supDl.trim() || undefined,
        address: supAddress.trim() || undefined,
        status: 'Active',
        creditDays: 30
      });

      addToast({
        type: 'success',
        title: 'Supplier Added',
        message: `${created.name} registered in directory.`
      });

      setIsNewSupplierOpen(false);
      resetForm();
      setPage(1);
      loadSuppliers(1, searchQuery);
      supplierService.getAll().then(setStatsSuppliers).catch(() => {});
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Could Not Save Supplier',
        message: err instanceof ApiError ? err.message : 'Failed to create supplier.'
      });
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setSupName('');
    setSupContact('');
    setSupPhone('');
    setSupEmail('');
    setSupGstin('');
    setSupDl('');
    setSupAddress('');
  };

  const handlePaySupplier = async () => {
    if (!selectedSupplier || isPaying) return;
    const amount = parseFloat(payAmount) || 0;
    if (amount <= 0) return;

    setIsPaying(true);
    try {
      const updated = await supplierService.payBalance(selectedSupplier.id, amount, payMethod);
      addToast({
        type: 'success',
        title: 'Wholesale Payment Recorded',
        message: `${formatINR(amount)} disbursed to ${updated.name}.`
      });

      setIsPayModalOpen(false);
      setSelectedSupplier(updated);
      loadSuppliers(page, searchQuery);
      loadLedger(updated.id, 1);
      supplierService.getAll().then(setStatsSuppliers).catch(() => {});
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Payment Not Recorded',
        message: err instanceof ApiError ? err.message : 'Failed to record payment.'
      });
    } finally {
      setIsPaying(false);
    }
  };

  const totalPayable = statsSuppliers.reduce((sum, s) => sum + s.outstandingAmount, 0);

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Wholesale Suppliers Directory
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Licensed drug stockists, GSTIN compliance records & wholesale accounts payable
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          onClick={() => setIsNewSupplierOpen(true)}
        >
          Add Supplier
        </Button>
      </div>

      {/* Overview Stat Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Registered Stockists</span>
          <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
            {pagination?.total ?? statsSuppliers.length} Vendors
          </div>
          <span className="text-[11px] text-slate-400">Verified Drug Licenses</span>
        </div>

        <div className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Accounts Payable Due</span>
          <div className="text-lg font-bold font-mono text-rose-600 mt-0.5">
            {formatINR(totalPayable)}
          </div>
          <span className="text-[11px] text-slate-400">Payable to wholesale distributors</span>
        </div>

        <div className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Supply Lines Health</span>
          <div className="text-lg font-bold font-mono text-teal-700 mt-0.5">
            100% Active
          </div>
          <span className="text-[11px] text-slate-400">FEFO batch tracking enabled</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-3 rounded-xl border border-slate-200 bg-white shadow-2xs">
        <Input
          placeholder="Search supplier name, contact person, phone, GSTIN..."
          value={searchQuery}
          onChange={handleSearchChange}
          leftIcon={<Search className="w-4 h-4" />}
          className="text-xs"
        />
      </div>

      {/* Suppliers Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
        {loadError ? (
          <div className="p-6 text-center text-xs text-rose-600">
            {loadError}{' '}
            <button className="underline font-semibold" onClick={() => loadSuppliers(page, searchQuery)}>
              Retry
            </button>
          </div>
        ) : isLoading ? (
          <div className="p-10 flex items-center justify-center text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : suppliers.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-400">
            No suppliers match your search.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3.5 font-semibold">Wholesaler / Company</th>
                    <th className="py-2.5 px-3.5 font-semibold">Contact Person</th>
                    <th className="py-2.5 px-3.5 font-semibold">Contact Numbers</th>
                    <th className="py-2.5 px-3.5 font-semibold">GSTIN / DL #</th>
                    <th className="py-2.5 px-3.5 font-semibold text-right">Outstanding Due</th>
                    <th className="py-2.5 px-3.5 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {suppliers.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3.5">
                        <div className="font-semibold text-slate-900">{s.name}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-xs">{s.address}</div>
                      </td>
                      <td className="py-2.5 px-3.5 text-slate-700">
                        {s.contactPerson}
                      </td>
                      <td className="py-2.5 px-3.5 font-mono">
                        <div className="text-slate-900">{s.phone}</div>
                        <div className="text-[10px] text-slate-400 font-sans">{s.email}</div>
                      </td>
                      <td className="py-2.5 px-3.5 font-mono text-[11px]">
                        <div className="text-slate-900 font-semibold">{s.gstin}</div>
                        <div className="text-slate-400">{s.drugLicenseNumber}</div>
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-mono font-bold">
                        <span className={s.outstandingAmount > 0 ? 'text-rose-600' : 'text-slate-400'}>
                          {formatINR(s.outstandingAmount)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="xs"
                            leftIcon={<BookOpen className="w-3.5 h-3.5" />}
                            onClick={() => openLedger(s)}
                          >
                            Ledger
                          </Button>
                          {s.outstandingAmount > 0 ? (
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => {
                                setSelectedSupplier(s);
                                setPayAmount(s.outstandingAmount.toString());
                                setPayMethod('Bank Transfer');
                                setIsPayModalOpen(true);
                              }}
                            >
                              Settle Due
                            </Button>
                          ) : (
                            <Badge variant="success" size="sm">Settled</Badge>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pagination && <Pagination pagination={pagination} onPageChange={setPage} itemLabel="suppliers" />}
          </>
        )}
      </div>

      {/* Supplier Ledger Drawer */}
      {selectedSupplier && (
        <Drawer
          isOpen={!!selectedSupplier}
          onClose={() => setSelectedSupplier(null)}
          title={selectedSupplier.name}
          description={`Supplier ID: ${selectedSupplier.id} • Outstanding: ${formatINR(selectedSupplier.outstandingAmount)}`}
          width="lg"
        >
          <div className="space-y-3.5 text-xs">
            <div className="p-3.5 rounded-lg border border-rose-200 bg-rose-50 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-rose-900">Accounts Payable</span>
                <div className="text-lg font-mono font-bold text-rose-800 mt-0.5">
                  {formatINR(selectedSupplier.outstandingAmount)}
                </div>
              </div>
              {selectedSupplier.outstandingAmount > 0 && (
                <Button
                  variant="primary"
                  size="xs"
                  onClick={() => {
                    setPayAmount(selectedSupplier.outstandingAmount.toString());
                    setPayMethod('Bank Transfer');
                    setIsPayModalOpen(true);
                  }}
                >
                  Disburse Payment
                </Button>
              )}
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-1.5">Payable Ledger History</h4>
              {isLedgerLoading ? (
                <div className="p-4 flex justify-center text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              ) : ledgerEntries.length === 0 ? (
                <p className="text-slate-400 text-[11px]">No ledger entries yet.</p>
              ) : (
                <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 overflow-hidden">
                  {ledgerEntries.map((entry) => (
                    <div key={entry.id} className="p-2.5 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Badge variant={entry.amount >= 0 ? 'danger' : 'success'} size="sm">{entry.type}</Badge>
                          <span className="text-[10px] text-slate-400">{formatDateTime(entry.createdAt)}</span>
                        </div>
                        {entry.notes && <p className="text-[10px] text-slate-500 mt-0.5">{entry.notes}</p>}
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <div className={`font-mono font-bold ${entry.amount >= 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                          {entry.amount >= 0 ? '+' : ''}{formatINR(entry.amount)}
                        </div>
                        <div className="text-[10px] text-slate-400">Bal: {formatINR(entry.balanceAfter)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {ledgerPagination && (
                <Pagination
                  pagination={ledgerPagination}
                  onPageChange={(p) => loadLedger(selectedSupplier.id, p)}
                  itemLabel="entries"
                />
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setSelectedSupplier(null)}>
                Close
              </Button>
            </div>
          </div>
        </Drawer>
      )}

      {/* Pay Supplier Modal */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title="Disburse Supplier Payment"
        description={`Vendor: ${selectedSupplier?.name} • Due: ${formatINR(selectedSupplier?.outstandingAmount || 0)}`}
        maxWidth="sm"
      >
        <div className="space-y-3">
          <Input
            label="Payment Amount Disbursed (₹)"
            type="number"
            step="any"
            value={payAmount}
            onChange={(e) => setPayAmount(e.target.value)}
            autoFocus
          />

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Payment Method</label>
            <select
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value as 'Cash' | 'UPI' | 'Card' | 'Bank Transfer')}
              className="w-full h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700"
            >
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <Button variant="outline" size="sm" onClick={() => setIsPayModalOpen(false)} disabled={isPaying}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handlePaySupplier} isLoading={isPaying}>
              Record Disbursement
            </Button>
          </div>
        </div>
      </Modal>

      {/* Register Supplier Modal */}
      <Modal
        isOpen={isNewSupplierOpen}
        onClose={() => setIsNewSupplierOpen(false)}
        title="Register Wholesale Distributor"
        description="Save wholesale supplier details for purchasing and inward stock"
        maxWidth="xl"
      >
        <form onSubmit={handleCreateSupplier} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <Input
              label="Distributor Company Name"
              placeholder="e.g. MedVance Biologicals Ltd"
              value={supName}
              onChange={(e) => setSupName(e.target.value)}
              required
              autoFocus
            />

            <Input
              label="Contact Representative"
              placeholder="e.g. Robert Miller"
              value={supContact}
              onChange={(e) => setSupContact(e.target.value)}
            />

            <Input
              label="Telephone / Mobile"
              placeholder="e.g. 9812345678"
              value={supPhone}
              onChange={(e) => setSupPhone(e.target.value)}
              required
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. orders@medvance.com"
              value={supEmail}
              onChange={(e) => setSupEmail(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <Input
              label="GSTIN Tax Identification"
              placeholder="e.g. 27AABCS9912E1Z8"
              value={supGstin}
              onChange={(e) => setSupGstin(e.target.value)}
            />

            <Input
              label="Drug Wholesale License (DL)"
              placeholder="e.g. DL-20B/21B-44912"
              value={supDl}
              onChange={(e) => setSupDl(e.target.value)}
            />
          </div>

          <Input
            label="Warehouse / Business Address"
            placeholder="e.g. 102 Sector 4 Pharma Zone, Mumbai"
            value={supAddress}
            onChange={(e) => setSupAddress(e.target.value)}
          />

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsNewSupplierOpen(false)} disabled={isCreating}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isCreating}>
              Save Wholesaler
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
