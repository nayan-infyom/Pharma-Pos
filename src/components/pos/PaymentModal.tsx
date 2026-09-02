import React, { useState, useEffect } from 'react';
import { usePOSStore } from '../../store/usePOSStore';
import { useAppStore } from '../../store/useAppStore';
import { salesService } from '../../services/salesService';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Kbd } from '../ui/Kbd';
import { 
  Banknote, 
  CreditCard, 
  QrCode, 
  BookOpen, 
  Layers, 
  AlertCircle, 
  Plus, 
  Trash2
} from 'lucide-react';
import { PaymentMethod, SplitPaymentDetail } from '../../types';
import { formatINR } from '../../utils/formatters';

export const PaymentModal: React.FC = () => {
  const {
    isPaymentOpen,
    closePayment,
    paymentMethod,
    setPaymentMethod,
    splitDetails,
    setSplitDetails,
    amountReceived,
    setAmountReceived,
    cart,
    customer,
    doctorName,
    cartDiscountPercent,
    getSubtotal,
    getTotalDiscount,
    getTaxTotal,
    getRoundOff,
    getGrandTotal,
    clearCart,
    setLastCompletedSale,
    setIsCompletedModalOpen
  } = usePOSStore();

  const { currentUser, addToast } = useAppStore();

  const grandTotal = getGrandTotal();
  const [cashTendered, setCashTendered] = useState<number>(grandTotal);
  const [isProcessing, setIsProcessing] = useState(false);

  // Quick cash preset amounts in INR (₹)
  const presets = [
    { label: 'Exact', amount: grandTotal },
    { label: '₹100', amount: 100 },
    { label: '₹200', amount: 200 },
    { label: '₹500', amount: 500 },
    { label: '₹1,000', amount: 1000 },
    { label: '₹2,000', amount: 2000 }
  ].filter(p => p.label === 'Exact' || p.amount >= grandTotal);

  useEffect(() => {
    if (isPaymentOpen) {
      setCashTendered(grandTotal);
      setAmountReceived(grandTotal);
      if (paymentMethod === 'Split' && splitDetails.length === 0) {
        setSplitDetails([
          { method: 'Cash', amount: Math.floor(grandTotal / 2) },
          { method: 'UPI', amount: grandTotal - Math.floor(grandTotal / 2) }
        ]);
      }
    }
  }, [isPaymentOpen, grandTotal]);

  // Keyboard shortcut: Ctrl + Enter to complete sale
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPaymentOpen && (e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleCompleteSale();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPaymentOpen, cashTendered, paymentMethod, splitDetails]);

  const changeDue = Math.max(0, cashTendered - grandTotal);

  const paymentMethods: { id: PaymentMethod; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'Cash', label: 'Cash Counter', icon: <Banknote className="w-4 h-4 text-emerald-600" />, desc: 'Physical currency' },
    { id: 'UPI/QR', label: 'UPI / QR Code', icon: <QrCode className="w-4 h-4 text-purple-600" />, desc: 'GPay / PhonePe / Paytm' },
    { id: 'Card', label: 'Debit / Credit Card', icon: <CreditCard className="w-4 h-4 text-blue-600" />, desc: 'EDC swipe / tap terminal' },
    { id: 'Credit', label: 'Credit (Khata)', icon: <BookOpen className="w-4 h-4 text-amber-600" />, desc: 'Patient khata ledger' },
    { id: 'Split', label: 'Split Payment', icon: <Layers className="w-4 h-4 text-teal-600" />, desc: 'Split across multiple modes' }
  ];

  const handleCompleteSale = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);

    try {
      const sale = await salesService.createSale({
        customerName: customer?.name || 'Walk-in Customer',
        customerPhone: customer?.phone || '9800000000',
        customerId: customer?.id,
        doctorName: doctorName || undefined,
        cashierName: currentUser.name,
        cashierId: currentUser.id,
        storeName: 'Apex Care Pharmacy - Main Branch',
        status: 'Completed',
        paymentMethod,
        splitDetails: paymentMethod === 'Split' ? (splitDetails as any) : undefined,
        items: cart.map(item => ({
          medicineId: item.medicineId,
          medicineName: item.medicineName,
          genericName: item.genericName,
          brand: item.brand,
          dosageForm: item.dosageForm,
          strength: item.strength,
          packSize: item.packSize,
          batchId: item.batchId,
          batchNumber: item.batchNumber,
          expiryDate: item.expiryDate,
          availableBatchStock: item.availableBatchStock,
          quantity: item.quantity,
          purchasePrice: item.purchasePrice,
          unitPrice: item.unitPrice,
          mrp: item.mrp,
          discountPercent: item.discountPercent,
          discountAmount: item.discountAmount,
          taxRate: item.taxRate,
          taxAmount: item.taxAmount,
          subtotal: item.subtotal,
          total: item.total,
          prescriptionRequired: item.prescriptionRequired
        })),
        itemCount: cart.reduce((sum, i) => sum + i.quantity, 0),
        subtotal: getSubtotal(),
        discountTotal: getTotalDiscount(),
        taxTotal: getTaxTotal(),
        roundOff: getRoundOff(),
        grandTotal,
        amountPaid: paymentMethod === 'Cash' ? cashTendered : grandTotal,
        changeDue: paymentMethod === 'Cash' ? changeDue : 0,
        changeReturned: paymentMethod === 'Cash' ? changeDue : 0
      });

      addToast({
        type: 'success',
        title: 'Sale Completed',
        message: `Invoice ${sale.invoiceNumber} generated for ${formatINR(grandTotal)}.`
      });

      setLastCompletedSale(sale);
      closePayment();
      clearCart();
      setIsCompletedModalOpen(true);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Transaction Failed',
        message: err.message || 'Failed to process sale.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const updateSplitAmount = (index: number, amt: number) => {
    const next = [...splitDetails];
    next[index].amount = Math.max(0, amt);
    setSplitDetails(next);
  };

  const updateSplitMethod = (index: number, method: SplitPaymentDetail['method']) => {
    const next = [...splitDetails];
    next[index].method = method;
    setSplitDetails(next);
  };

  const addSplitRow = () => {
    setSplitDetails([...splitDetails, { method: 'Cash', amount: 0 }]);
  };

  const removeSplitRow = (index: number) => {
    if (splitDetails.length > 1) {
      setSplitDetails(splitDetails.filter((_, i) => i !== index));
    }
  };

  const splitSum = splitDetails.reduce((sum, item) => sum + (item.amount || 0), 0);

  return (
    <Modal
      isOpen={isPaymentOpen}
      onClose={closePayment}
      title={
        <div className="flex items-center justify-between w-full pr-6">
          <div className="flex items-center gap-2">
            <Banknote className="w-4 h-4 text-emerald-600" />
            <span className="text-base font-bold text-slate-900">Process Payment</span>
          </div>
          <span className="text-lg font-mono font-bold text-emerald-700">
            {formatINR(grandTotal)}
          </span>
        </div>
      }
      description={`Customer: ${customer?.name || 'Walk-in Customer'} • ${cart.length} item(s)`}
      maxWidth="xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="outline" size="sm" onClick={closePayment} disabled={isProcessing}>
            Cancel (Esc)
          </Button>

          <Button
            variant="primary"
            size="md"
            isLoading={isProcessing}
            disabled={paymentMethod === 'Split' && Math.abs(splitSum - grandTotal) > 0.01}
            onClick={handleCompleteSale}
            rightIcon={<Kbd className="bg-emerald-700 text-white border-none text-[10px]">Ctrl+↵</Kbd>}
          >
            Complete Sale
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Payment mode selector buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {paymentMethods.map((m) => {
            const isSelected = paymentMethod === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setPaymentMethod(m.id)}
                className={`p-3 rounded-lg border flex flex-col items-start transition-colors cursor-pointer text-left ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50/60 shadow-2xs'
                    : 'border-slate-200 hover:bg-slate-50 bg-white shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  {m.icon}
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
                </div>
                <div className="text-xs font-semibold text-slate-900">{m.label}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{m.desc}</div>
              </button>
            );
          })}
        </div>

        {/* Method-Specific Panels */}
        {paymentMethod === 'Cash' && (
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1">
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Cash Tendered (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  value={cashTendered || ''}
                  onChange={(e) => setCashTendered(parseFloat(e.target.value) || 0)}
                  className="w-full text-lg font-bold font-mono px-3 py-1.5 rounded-md border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                  autoFocus
                />
              </div>

              {/* Quick Cash Presets */}
              <div className="flex flex-wrap gap-1.5 sm:pt-4">
                {presets.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCashTendered(p.amount)}
                    className="px-2.5 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-100 text-xs font-medium text-slate-700 cursor-pointer shadow-2xs"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Change return banner */}
            <div className="flex items-center justify-between p-2.5 rounded-md bg-emerald-50 border border-emerald-200">
              <span className="text-xs font-semibold text-emerald-800">
                Change to return:
              </span>
              <span className="text-base font-mono font-bold text-emerald-800">
                {formatINR(changeDue)}
              </span>
            </div>
          </div>
        )}

        {paymentMethod === 'UPI/QR' && (
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col items-center text-center space-y-2.5">
            <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
              <QrCode className="w-24 h-24 text-slate-900" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">
                Scan to pay <span className="font-mono text-emerald-700">{formatINR(grandTotal)}</span>
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                UPI ID: apexcare.pharmacy@hdfcbank • Dynamic QR
              </p>
            </div>
          </div>
        )}

        {paymentMethod === 'Card' && (
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-center">
            <CreditCard className="w-8 h-8 text-blue-600 mx-auto" />
            <div>
              <p className="text-xs font-semibold text-slate-800">
                Swipe / Tap Card on Connected EDC Machine
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Amount transmitted: <span className="font-mono font-bold text-slate-900">{formatINR(grandTotal)}</span>
              </p>
            </div>
          </div>
        )}

        {paymentMethod === 'Credit' && (
          <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 space-y-1.5">
            <div className="flex items-center gap-2 text-amber-800 font-semibold text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Customer Khata Ledger</span>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">
              Total of <span className="font-mono font-bold">{formatINR(grandTotal)}</span> will be added to <strong>{customer?.name}</strong>'s outstanding balance (Current balance: {formatINR(customer?.outstandingBalance || 0)}).
            </p>
          </div>
        )}

        {paymentMethod === 'Split' && (
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>Split breakdown</span>
              <button
                type="button"
                onClick={addSplitRow}
                className="text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                <Plus className="w-3.5 h-3.5" /> Add split line
              </button>
            </div>

            <div className="space-y-2">
              {splitDetails.map((row, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <select
                    value={row.method}
                    onChange={(e) => updateSplitMethod(idx, e.target.value as SplitPaymentDetail['method'])}
                    className="h-8 px-2 rounded border border-slate-300 bg-white text-xs font-medium text-slate-900"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI / QR</option>
                    <option value="Card">Card</option>
                    <option value="Credit">Credit (Khata)</option>
                  </select>

                  <Input
                    type="number"
                    value={row.amount || ''}
                    onChange={(e) => updateSplitAmount(idx, parseFloat(e.target.value) || 0)}
                    placeholder="Amount"
                    className="h-8 font-mono text-xs font-semibold"
                  />

                  {splitDetails.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSplitRow(idx)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
              <span className="text-slate-500">Allocated sum:</span>
              <span className={`font-mono font-bold ${Math.abs(splitSum - grandTotal) <= 0.01 ? 'text-emerald-700' : 'text-rose-600'}`}>
                {formatINR(splitSum)} / {formatINR(grandTotal)}
              </span>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

