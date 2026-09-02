import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { expenseService } from '../services/expenseService';
import { Expense } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { 
  Search, 
  Plus, 
  Trash2
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { formatINR, formatDate } from '../utils/formatters';

export const ExpensesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser, addToast } = useAppStore();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form state
  const [category, setCategory] = useState<Expense['category']>('Utilities / Electricity');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank Transfer' | 'Card' | 'UPI'>('Cash');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadExpenses();
    if (searchParams.get('action') === 'new') {
      setIsAddOpen(true);
      setSearchParams({});
    }
  }, []);

  const loadExpenses = async () => {
    const list = await expenseService.getAll();
    setExpenses(list);
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount) || 0;
    if (!title.trim() || amt <= 0) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Expense description and valid amount are required.'
      });
      return;
    }

    const created = await expenseService.create({
      category,
      title: title.trim(),
      amount: amt,
      date: new Date().toISOString().split('T')[0],
      paymentMethod,
      paidTo: 'Utility Vendor',
      recordedBy: currentUser.name,
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
    loadExpenses();
  };

  const resetForm = () => {
    setTitle('');
    setAmount('');
    setReceiptNumber('');
    setNotes('');
  };

  const handleDeleteExpense = async (id: string) => {
    await expenseService.delete(id);
    addToast({
      type: 'info',
      title: 'Expense Removed',
      message: 'Record deleted from operational ledger.'
    });
    loadExpenses();
  };

  const filteredExpenses = expenses.filter(exp => {
    const q = (searchQuery || '').toLowerCase().trim();
    const matchesSearch =
      !q ||
      (exp.title || '').toLowerCase().includes(q) ||
      (exp.category || '').toLowerCase().includes(q) ||
      (exp.receiptNumber && exp.receiptNumber.toLowerCase().includes(q));

    const matchesCat = categoryFilter === 'All' || exp.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const totalExpenseAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const categories: Expense['category'][] = [
    'Rent',
    'Utilities / Electricity',
    'Salaries & Wages',
    'Cold Chain / Refrigeration',
    'Packaging & Pharmacy Bags',
    'Cleaning & Sanitation',
    'Software & Telecom',
    'Maintenance & Repairs',
    'Miscellaneous'
  ];

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
          <span className="text-xs text-slate-500 font-medium">Expenses Total</span>
          <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
            {formatINR(totalExpenseAmount)}
          </div>
          <span className="text-[11px] text-slate-400">{filteredExpenses.length} Expense Entries</span>
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
            placeholder="Search expense description, receipt #, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            className="text-xs"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700"
        >
          <option value="All">All Categories</option>
          {categories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Expenses Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3.5 font-semibold">Expense Title / Item</th>
                <th className="py-2.5 px-3.5 font-semibold">Category</th>
                <th className="py-2.5 px-3.5 font-semibold">Date</th>
                <th className="py-2.5 px-3.5 font-semibold">Method</th>
                <th className="py-2.5 px-3.5 font-semibold">Recorded By</th>
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
                  <td className="py-2.5 px-3.5 text-slate-600">{exp.recordedBy}</td>
                  <td className="py-2.5 px-3.5 text-right font-mono font-bold text-slate-900">
                    {formatINR(exp.amount)}
                  </td>
                  <td className="py-2.5 px-3.5 text-center">
                    <button
                      type="button"
                      onClick={() => handleDeleteExpense(exp.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Delete record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700"
            >
              {categories.map(c => (
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
                onChange={(e) => setPaymentMethod(e.target.value as any)}
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
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Expense Entry
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
