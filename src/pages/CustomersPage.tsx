import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { customerService } from '../services/customerService';
import { Customer, CustomerLedgerEntry } from '../types';
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
  AlertOctagon,
  Eye,
  ShoppingCart,
  Loader2
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { usePOSStore } from '../store/usePOSStore';
import { formatINR, formatDateTime } from '../utils/formatters';

const PAGE_SIZE = 20;

export const CustomersPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useAppStore();
  const { setCustomer } = usePOSStore();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Stat-strip aggregates — a separate capped read, since the paginated list
  // endpoint only returns per-page data, not cross-collection sums (same
  // "capped at 100" limitation already documented for medicineService/etc).
  const [statsCustomers, setStatsCustomers] = useState<Customer[]>([]);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<CustomerLedgerEntry[]>([]);
  const [ledgerPagination, setLedgerPagination] = useState<PaginationMeta | null>(null);
  const [ledgerPage, setLedgerPage] = useState(1);
  const [isLedgerLoading, setIsLedgerLoading] = useState(false);

  const [isNewCustOpen, setIsNewCustOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const [settleAmount, setSettleAmount] = useState('0');
  const [settleMethod, setSettleMethod] = useState<'Cash' | 'UPI' | 'Card'>('Cash');

  // Form state
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custAllergies, setCustAllergies] = useState('');
  const [custConditions, setCustConditions] = useState('');
  const [custCreditLimit, setCustCreditLimit] = useState('5000');

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setIsNewCustOpen(true);
      setSearchParams({});
    }
    customerService.getAll().then(setStatsCustomers).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadCustomers(page, searchQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const loadCustomers = async (targetPage: number, search: string) => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const { items, pagination: p } = await customerService.list({ search: search || undefined, page: targetPage, limit: PAGE_SIZE });
      setCustomers(items);
      setPagination(p);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Failed to load customers.');
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
      loadCustomers(1, val);
    }, 300);
  };

  const loadLedger = async (customerId: string, targetPage: number) => {
    setIsLedgerLoading(true);
    try {
      const { items, pagination: p } = await customerService.getLedger(customerId, targetPage, 10);
      setLedgerEntries(items);
      setLedgerPagination(p);
    } catch {
      setLedgerEntries([]);
      setLedgerPagination(null);
    } finally {
      setIsLedgerLoading(false);
    }
  };

  const openProfile = (c: Customer) => {
    setSelectedCustomer(c);
    setLedgerPage(1);
    loadLedger(c.id, 1);
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreating) return;
    if (!custName.trim() || !custPhone.trim()) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Customer name and phone number are required.'
      });
      return;
    }

    const allergiesArr = custAllergies.split(',').map(s => s.trim()).filter(Boolean);
    const conditionsArr = custConditions.split(',').map(s => s.trim()).filter(Boolean);

    setIsCreating(true);
    try {
      const created = await customerService.create({
        name: custName.trim(),
        phone: custPhone.trim(),
        email: custEmail.trim() || undefined,
        address: custAddress.trim() || undefined,
        allergies: allergiesArr,
        chronicConditions: conditionsArr,
        creditLimit: parseFloat(custCreditLimit) || 5000
      });

      addToast({
        type: 'success',
        title: 'Patient Account Created',
        message: `${created.name} added to pharmacy registry.`
      });

      setIsNewCustOpen(false);
      resetForm();
      setPage(1);
      loadCustomers(1, searchQuery);
      customerService.getAll().then(setStatsCustomers).catch(() => {});
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Could Not Save Patient',
        message: err instanceof ApiError ? err.message : 'Failed to create customer.'
      });
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setCustName('');
    setCustPhone('');
    setCustEmail('');
    setCustAddress('');
    setCustAllergies('');
    setCustConditions('');
  };

  const handleSettleBalance = async () => {
    if (!selectedCustomer || isSettling) return;
    const amount = parseFloat(settleAmount) || 0;
    if (amount <= 0) return;

    setIsSettling(true);
    try {
      const updated = await customerService.settleBalance(selectedCustomer.id, amount, settleMethod);
      addToast({
        type: 'success',
        title: 'Khata Payment Recorded',
        message: `${formatINR(amount)} credited to ${updated.name}'s ledger.`
      });

      setIsSettleModalOpen(false);
      setSelectedCustomer(updated);
      loadCustomers(page, searchQuery);
      loadLedger(updated.id, 1);
      setLedgerPage(1);
      customerService.getAll().then(setStatsCustomers).catch(() => {});
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Payment Not Recorded',
        message: err instanceof ApiError ? err.message : 'Failed to settle balance.'
      });
    } finally {
      setIsSettling(false);
    }
  };

  const totalOutstanding = statsCustomers.reduce((sum, c) => sum + c.outstandingBalance, 0);
  const totalPoints = statsCustomers.reduce((sum, c) => sum + c.loyaltyPoints, 0);

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Customers & Chronic Patients
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage patient health profiles, recorded drug allergies, credit ledgers (Khata) and loyalty points
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          onClick={() => setIsNewCustOpen(true)}
        >
          Register Patient
        </Button>
      </div>

      {/* Overview Stat Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Registered Patients</span>
          <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
            {pagination?.total ?? statsCustomers.length} Patients
          </div>
          <span className="text-[11px] text-slate-400">With medical records</span>
        </div>

        <div className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Khata Credit Due</span>
          <div className="text-lg font-bold font-mono text-amber-700 mt-0.5">
            {formatINR(totalOutstanding)}
          </div>
          <span className="text-[11px] text-slate-400">Total customer balance receivable</span>
        </div>

        <div className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Loyalty Pool</span>
          <div className="text-lg font-bold font-mono text-teal-700 mt-0.5">
            {totalPoints.toLocaleString()} pts
          </div>
          <span className="text-[11px] text-slate-400">Redeemable at billing</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-3 rounded-xl border border-slate-200 bg-white shadow-2xs">
        <Input
          placeholder="Search patient name, mobile number..."
          value={searchQuery}
          onChange={handleSearchChange}
          leftIcon={<Search className="w-4 h-4" />}
          className="text-xs"
        />
      </div>

      {/* Customers Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
        {loadError ? (
          <div className="p-6 text-center text-xs text-rose-600">
            {loadError}{' '}
            <button className="underline font-semibold" onClick={() => loadCustomers(page, searchQuery)}>
              Retry
            </button>
          </div>
        ) : isLoading ? (
          <div className="p-10 flex items-center justify-center text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : customers.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-400">
            No customers match your search.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3.5 font-semibold">Patient Name</th>
                    <th className="py-2.5 px-3.5 font-semibold">Contact</th>
                    <th className="py-2.5 px-3.5 font-semibold">Chronic Care / Allergies</th>
                    <th className="py-2.5 px-3.5 font-semibold text-right">Loyalty Pts</th>
                    <th className="py-2.5 px-3.5 font-semibold text-right">Khata Due</th>
                    <th className="py-2.5 px-3.5 font-semibold text-right">Total Spent</th>
                    <th className="py-2.5 px-3.5 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3.5">
                        <div className="font-semibold text-slate-900">{c.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">ID: {c.id.slice(-4)}</div>
                      </td>
                      <td className="py-2.5 px-3.5 font-mono">
                        <div className="text-slate-900">{c.phone}</div>
                        {c.email && <div className="text-[10px] text-slate-400 font-sans">{c.email}</div>}
                      </td>
                      <td className="py-2.5 px-3.5">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {c.allergies && c.allergies.length > 0 && (
                            c.allergies.map(al => (
                              <Badge key={al} variant="danger" size="sm">Allergy: {al}</Badge>
                            ))
                          )}
                          {c.chronicConditions && c.chronicConditions.length > 0 && (
                            c.chronicConditions.map(cond => (
                              <Badge key={cond} variant="teal" size="sm">{cond}</Badge>
                            ))
                          )}
                          {(!c.allergies || c.allergies.length === 0) && (!c.chronicConditions || c.chronicConditions.length === 0) && (
                            <span className="text-slate-400 text-[11px]">-</span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-mono font-semibold text-teal-700">
                        {c.loyaltyPoints}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-mono font-bold">
                        <span className={c.outstandingBalance > 0 ? 'text-amber-700' : 'text-slate-400'}>
                          {formatINR(c.outstandingBalance)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-mono font-semibold text-slate-900">
                        {formatINR(c.totalPurchases)}
                      </td>
                      <td className="py-2.5 px-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="xs"
                            leftIcon={<Eye className="w-3.5 h-3.5" />}
                            onClick={() => openProfile(c)}
                          >
                            Profile
                          </Button>

                          <Button
                            variant="ghost"
                            size="xs"
                            leftIcon={<ShoppingCart className="w-3.5 h-3.5 text-emerald-600" />}
                            onClick={() => {
                              setCustomer(c);
                              addToast({
                                type: 'info',
                                title: 'Customer Selected',
                                message: `${c.name} assigned to active POS terminal.`
                              });
                              navigate('/pos');
                            }}
                          >
                            Bill
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pagination && <Pagination pagination={pagination} onPageChange={setPage} itemLabel="patients" />}
          </>
        )}
      </div>

      {/* Patient Profile Drawer */}
      {selectedCustomer && (
        <Drawer
          isOpen={!!selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          title={selectedCustomer.name}
          description={`Patient ID: ${selectedCustomer.id} • Registered patient`}
          width="lg"
        >
          <div className="space-y-3.5 text-xs">
            {/* Health warnings */}
            {selectedCustomer.allergies && selectedCustomer.allergies.length > 0 && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-rose-800">
                  <AlertOctagon className="w-4 h-4" />
                  <span>Documented Drug Allergies (CRITICAL)</span>
                </div>
                <div className="flex flex-wrap gap-1 pt-1">
                  {selectedCustomer.allergies.map(al => (
                    <Badge key={al} variant="danger" size="sm">{al}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* General metrics */}
            <div className="grid grid-cols-2 gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div>
                <span className="text-slate-500">Mobile Phone:</span>
                <p className="font-mono font-semibold text-slate-900">{selectedCustomer.phone}</p>
              </div>
              <div>
                <span className="text-slate-500">Email Address:</span>
                <p className="font-semibold text-slate-900">{selectedCustomer.email || 'N/A'}</p>
              </div>
              <div>
                <span className="text-slate-500">Loyalty Points:</span>
                <p className="font-mono font-semibold text-teal-700">{selectedCustomer.loyaltyPoints} points</p>
              </div>
              <div>
                <span className="text-slate-500">Credit Limit:</span>
                <p className="font-mono font-semibold text-slate-900">{formatINR(selectedCustomer.creditLimit)}</p>
              </div>
            </div>

            {/* Khata Ledger Balance Card */}
            <div className="p-3.5 rounded-lg border border-amber-200 bg-amber-50 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-amber-900">
                  Khata Outstanding Balance
                </span>
                <div className="text-lg font-mono font-bold text-amber-800 mt-0.5">
                  {formatINR(selectedCustomer.outstandingBalance)}
                </div>
              </div>

              {selectedCustomer.outstandingBalance > 0 && (
                <Button
                  variant="primary"
                  size="xs"
                  onClick={() => {
                    setSettleAmount(selectedCustomer.outstandingBalance.toString());
                    setSettleMethod('Cash');
                    setIsSettleModalOpen(true);
                  }}
                >
                  Receive Payment
                </Button>
              )}
            </div>

            {/* Ledger History */}
            <div>
              <h4 className="font-semibold text-slate-900 mb-1.5">
                Khata Transaction History
              </h4>
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
                          <Badge variant={entry.amount >= 0 ? 'warning' : 'success'} size="sm">{entry.type}</Badge>
                          <span className="text-[10px] text-slate-400">{formatDateTime(entry.createdAt)}</span>
                        </div>
                        {entry.notes && <p className="text-[10px] text-slate-500 mt-0.5">{entry.notes}</p>}
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <div className={`font-mono font-bold ${entry.amount >= 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
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
                  onPageChange={(p) => {
                    setLedgerPage(p);
                    loadLedger(selectedCustomer.id, p);
                  }}
                  itemLabel="entries"
                />
              )}
            </div>

            {/* Chronic Conditions */}
            <div>
              <h4 className="font-semibold text-slate-900 mb-1">
                Chronic Health Conditions
              </h4>
              <div className="flex flex-wrap gap-1">
                {selectedCustomer.chronicConditions && selectedCustomer.chronicConditions.length > 0 ? (
                  selectedCustomer.chronicConditions.map(c => (
                    <Badge key={c} variant="teal" size="sm">{c}</Badge>
                  ))
                ) : (
                  <span className="text-slate-400">No chronic conditions listed.</span>
                )}
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-3 border-t border-slate-200 flex justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCustomer(null)}
              >
                Close
              </Button>

              <Button
                variant="primary"
                size="sm"
                leftIcon={<ShoppingCart className="w-3.5 h-3.5" />}
                onClick={() => {
                  setCustomer(selectedCustomer);
                  setSelectedCustomer(null);
                  navigate('/pos');
                }}
              >
                Open POS Cart
              </Button>
            </div>
          </div>
        </Drawer>
      )}

      {/* Settle Khata Payment Modal */}
      <Modal
        isOpen={isSettleModalOpen}
        onClose={() => setIsSettleModalOpen(false)}
        title={`Receive Khata Balance Payment`}
        description={`Customer: ${selectedCustomer?.name} (Due: ${formatINR(selectedCustomer?.outstandingBalance || 0)})`}
        maxWidth="sm"
      >
        <div className="space-y-3">
          <Input
            label="Payment Amount Received (₹)"
            type="number"
            step="any"
            value={settleAmount}
            onChange={(e) => setSettleAmount(e.target.value)}
            autoFocus
          />

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Payment Method</label>
            <select
              value={settleMethod}
              onChange={(e) => setSettleMethod(e.target.value as 'Cash' | 'UPI' | 'Card')}
              className="w-full h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700"
            >
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <Button variant="outline" size="sm" onClick={() => setIsSettleModalOpen(false)} disabled={isSettling}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSettleBalance} isLoading={isSettling}>
              Confirm Received
            </Button>
          </div>
        </div>
      </Modal>

      {/* Register Customer Modal */}
      <Modal
        isOpen={isNewCustOpen}
        onClose={() => setIsNewCustOpen(false)}
        title="Register Patient Profile"
        description="Record demographic details, allergies & chronic medical conditions"
        maxWidth="xl"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <Input
              label="Full Name"
              placeholder="e.g. Eleanor Vance"
              value={custName}
              onChange={(e) => setCustName(e.target.value)}
              required
              autoFocus
            />

            <Input
              label="Mobile Phone Number"
              placeholder="e.g. 9812345678"
              value={custPhone}
              onChange={(e) => setCustPhone(e.target.value)}
              required
            />

            <Input
              label="Email Address (Optional)"
              type="email"
              placeholder="e.g. patient@example.com"
              value={custEmail}
              onChange={(e) => setCustEmail(e.target.value)}
            />

            <Input
              label="Credit (Khata) Limit (₹)"
              type="number"
              value={custCreditLimit}
              onChange={(e) => setCustCreditLimit(e.target.value)}
            />
          </div>

          <Input
            label="Residential Address"
            placeholder="e.g. 45 Pine Hill Road"
            value={custAddress}
            onChange={(e) => setCustAddress(e.target.value)}
          />

          <Input
            label="Known Drug Allergies (Comma-separated)"
            placeholder="e.g. Penicillin, Sulfa drugs, Aspirin"
            value={custAllergies}
            onChange={(e) => setCustAllergies(e.target.value)}
          />

          <Input
            label="Chronic Conditions (Comma-separated)"
            placeholder="e.g. Type 2 Diabetes, Hypertension, Asthma"
            value={custConditions}
            onChange={(e) => setCustConditions(e.target.value)}
          />

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsNewCustOpen(false)} disabled={isCreating}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isCreating}>
              Save Patient Profile
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
