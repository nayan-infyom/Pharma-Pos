import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { expenseService } from '../services/expenseService';
import { Expense } from '../types';
import { ApiError, Pagination as PaginationMeta } from '../api/client';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import {
  Search,
  Plus,
  Trash2,
  Loader2
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { formatINR, formatDate } from '../utils/formatters';

const PAGE_SIZE = 20;

// Canonical backend categories only (server/src/models/enums.ts EXPENSE_CATEGORIES) —
// the long-form legacy values (e.g. 'Utilities / Electricity') stay in the
// Expense['category'] union for displaying old records but are never offered
// for new ones.
const CATEGORIES: Expense['category'][] = [
  'Rent',
  'Salaries',
  'Utilities',
  'Cold Chain Electricity',
  'Bio-Waste Disposal',
  'Packaging & Stationery',
  'Software & Subscriptions',
  'Maintenance',
  'Other'
];

export const ExpensesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useAppStore();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<Expense['category'] | 'All'>('All');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [category, setCategory] = useState<Expense['category']>('Utilities');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank Transfer' | 'Card' | 'UPI'>('Cash');
  const [paidTo, setPaidTo] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setIsAddOpen(true);
      setSearchParams({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadExpenses(page, categoryFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, categoryFilter]);

  const loadExpenses = async (targetPage: number, cat: Expense['category'] | 'All') => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const { items, pagination: p } = await expenseService.list({
        category: cat === 'All' ? undefined : cat,
        page: targetPage,
        limit: PAGE_SIZE
      });
      setExpenses(items);
      setPagination(p);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Failed to load expenses.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreating) return;
    const amt = parseFloat(amount) || 0;
    if (!title.trim() || amt <= 0) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Expense description and valid amount are required.'
      });
      return;
    }

    setIsCreating(true);
    try {
      const created = await expenseService.create({
        category,
        title: title.trim(),
        amount: amt,
        paymentMethod,
        paidTo: paidTo.trim() || undefined,
        receiptNumber: receiptNumber.trim() || undefined,
        notes: notes.trim() || undefined
      });

      addToast({
        type: 'success',
        title: 'Expense Logged',
        message: `${created.title} (${formatINR(amt)}) recorded.`
      });

      setIsAddOpen(false);
      resetForm();
      setPage(1);
      loadExpenses(1, categoryFilter);
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Could Not Save Expense',
        message: err instanceof ApiError ? err.message : 'Failed to record expense.'
      });
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setAmount('');
    setPaidTo('');
    setReceiptNumber('');
    setNotes('');
  };

  const handleDeleteExpense = async (id: string) => {
    if (deletingId) return;
    setDeletingId(id);
    try {
      await expenseService.delete(id);
      addToast({
        type: 'info',
        title: 'Expense Removed',
        message: 'Record deleted from operational ledger.'
      });
      loadExpenses(page, categoryFilter);
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Could Not Delete Expense',
        message: err instanceof ApiError ? err.message : 'Failed to delete expense.'
      });
    } finally {
      setDeletingId(null);
    }
  };

  // Free-text search has no backend index for this endpoint — refined
  // client-side over the current server-paginated page (same documented
  // pattern as Prescriptions/Returns).
  const filteredExpenses = expenses.filter(exp => {
    const q = (searchQuery || '').toLowerCase().trim();
    if (!q) return true;
    return (
      (exp.title || '').toLowerCase().includes(q) ||
      (exp.category || '').toLowerCase().includes(q) ||
      (exp.receiptNumber && exp.receiptNumber.toLowerCase().includes(q))
    );
  });

  const totalExpenseAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Operating Expenses & Overhead Ledger
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Log pharmacy overheads, cold chain power, store rent and staff payroll disbursements
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          onClick={() => setIsAddOpen(true)}
        >
          Record Expense
        </Button>
      </div>

      {/* Overview Stat Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Expenses Total (this page)</span>
          <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
            {formatINR(totalExpenseAmount)}
          </div>
          <span className="text-[11px] text-slate-400">{pagination?.total ?? filteredExpenses.length} Expense Entries</span>
        </div>

        <div className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Major Cost Center</span>
          <div className="text-base font-bold text-slate-900 mt-0.5">
            Rent & Cold Chain
          </div>
          <span className="text-[11px] text-slate-400">Vaccine & insulin temperature compliance</span>
        </div>

        <div className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Bookkeeping Status</span>
          <div className="text-lg font-bold font-mono text-emerald-700 mt-0.5">
            Reconciled
          </div>
          <span className="text-[11px] text-slate-400">Integrated into P&L reports</span>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="p-3 rounded-xl border border-slate-200 bg-white shadow-2xs flex flex-col sm:flex-row gap-2.5">
        <div className="flex-1">
          <Input
            placeholder="Search expense description, receipt # (current page)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            className="text-xs"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value as Expense['category'] | 'All'); setPage(1); }}
          className="h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700"
        >
          <option value="All">All Categories</option>
          {CATEGORIES.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Expenses Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
        {loadError ? (
          <div className="p-6 text-center text-xs text-rose-600">
            {loadError}{' '}
            <button className="underline font-semibold" onClick={() => loadExpenses(page, categoryFilter)}>Retry</button>
          </div>
        ) : isLoading ? (
          <div className="p-10 flex items-center justify-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin" /></div>
        ) : filteredExpenses.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-400">No expenses match your search.</div>
        ) : (
        <>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3.5 font-semibold">Expense Title / Item</th>
                <th className="py-2.5 px-3.5 font-semibold">Category</th>
                <th className="py-2.5 px-3.5 font-semibold">Date</th>
                <th className="py-2.5 px-3.5 font-semibold">Method</th>
                <th className="py-2.5 px-3.5 font-semibold text-right">Amount</th>
                <th className="py-2.5 px-3.5 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3.5">
                    <div className="font-semibold text-slate-900">{exp.title}</div>
                    {exp.receiptNumber && <div className="text-[10px] text-slate-400 font-mono">Ref: {exp.receiptNumber}</div>}
                  </td>
                  <td className="py-2.5 px-3.5">
                    <Badge variant="teal" size="sm">{exp.category}</Badge>
                  </td>
                  <td className="py-2.5 px-3.5 font-mono text-slate-500">{formatDate(exp.date)}</td>
                  <td className="py-2.5 px-3.5">
                    <Badge variant="default" size="sm">{exp.paymentMethod}</Badge>
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-mono font-bold text-slate-900">
                    {formatINR(exp.amount)}
                  </td>
                  <td className="py-2.5 px-3.5 text-center">
                    <button
                      type="button"
                      onClick={() => handleDeleteExpense(exp.id)}
                      disabled={deletingId === exp.id}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer disabled:opacity-40"
                      title="Delete record"
                    >
                      {deletingId === exp.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pagination && <Pagination pagination={pagination} onPageChange={setPage} itemLabel="expenses" />}
        </>
        )}
      </div>

      {/* Record Expense Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Record Operating Expense"
        description="Log store disbursements for overhead & profit calculation"
        maxWidth="md"
      >
        <form onSubmit={handleAddExpense} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Expense Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Expense['category'])}
              className="w-full h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700"
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <Input
            label="Expense Description / Title"
            placeholder="e.g. Monthly Electricity & Backup Generator Fuel"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
          />

          <div className="grid grid-cols-2 gap-2.5">
            <Input
              label="Amount (₹)"
              type="number"
              step="any"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as 'Cash' | 'Bank Transfer' | 'Card' | 'UPI')}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700"
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Card">Debit / Credit Card</option>
                <option value="UPI">UPI</option>
              </select>
            </div>
          </div>

          <Input
            label="Paid To (Optional)"
            placeholder="e.g. City Electricity Board"
            value={paidTo}
            onChange={(e) => setPaidTo(e.target.value)}
          />

          <Input
            label="Receipt / Voucher Number (Optional)"
            placeholder="e.g. VCH-88319"
            value={receiptNumber}
            onChange={(e) => setReceiptNumber(e.target.value)}
          />

          <Input
            label="Notes / Comments"
            placeholder="e.g. Approved by Store General Manager"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddOpen(false)} disabled={isCreating}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isCreating}>
              Save Expense Entry
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
