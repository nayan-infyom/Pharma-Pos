import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  AlertTriangle,
  Clock,
  Building2,
  RefreshCw,
  ShoppingCart,
  Receipt,
  Boxes,
  Eye,
  ArrowRight,
  Pill,
  Calendar,
  Users,
  CreditCard,
  FileText,
  Plus,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  Truck,
  ArrowUpRight,
  Sparkles,
  SlidersHorizontal,
  Wallet
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { salesService } from '../services/salesService';
import { medicineService } from '../services/medicineService';
import { customerService } from '../services/customerService';
import { supplierService } from '../services/supplierService';
import { purchaseService } from '../services/purchaseService';
import { prescriptionService } from '../services/prescriptionService';
import { inventoryService } from '../services/inventoryService';
import { SaleInvoice, Medicine, Customer, Supplier, PurchaseOrder, Prescription, StockMovement } from '../types';
import { formatINR, formatCompactINR, formatDate, formatTime } from '../utils/formatters';
import { useAppStore } from '../store/useAppStore';
import { usePOSStore } from '../store/usePOSStore';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, addToast } = useAppStore();
  const { clearCart, setCustomer, setDoctorName, addItem } = usePOSStore();

  const [sales, setSales] = useState<SaleInvoice[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<PurchaseOrder[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);

  const [selectedInvoice, setSelectedInvoice] = useState<SaleInvoice | null>(null);
  const [chartRange, setChartRange] = useState<'today' | '7d' | '30d' | '12m'>('today');
  const [activeAttentionTab, setActiveAttentionTab] = useState<'stock' | 'expiry' | 'rx' | 'khata' | 'suppliers'>('stock');
  const [isLoading, setIsLoading] = useState(true);

  // Quick Settle Modal State
  const [settleCustomer, setSettleCustomer] = useState<Customer | null>(null);
  const [settleAmount, setSettleAmount] = useState<string>('');
  const [settleMethod, setSettleMethod] = useState<'Cash' | 'UPI' | 'Card'>('Cash');
  const [isSettling, setIsSettling] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    const [allSales, allMeds, allCusts, allSups, allPurch, allRx, allMovs] = await Promise.all([
      salesService.getAll(),
      medicineService.getAll(),
      customerService.getAll(),
      supplierService.getAll(),
      purchaseService.getAll(),
      prescriptionService.getAll(),
      inventoryService.getMovements()
    ]);
    setSales(allSales);
    setMedicines(allMeds);
    setCustomers(allCusts);
    setSuppliers(allSups);
    setPurchases(allPurch);
    setPrescriptions(allRx);
    setMovements(allMovs.slice(0, 8));
    setIsLoading(false);
  };

  // Operational Calculations
  const todayTotalSales = sales.reduce((acc, s) => acc + s.grandTotal, 0);
  const todayOrders = sales.length;
  const avgOrderValue = todayOrders > 0 ? todayTotalSales / todayOrders : 0;
  const estimatedGrossProfit = todayTotalSales * 0.285;
  
  const totalInventoryCost = medicines.reduce((acc, m) => acc + (m.totalStock * m.purchasePrice), 0);
  const totalInventoryRetail = medicines.reduce((acc, m) => acc + (m.totalStock * m.sellingPrice), 0);
  
  const totalKhataDue = customers.reduce((acc, c) => acc + (c.outstandingBalance || 0), 0);
  const totalSupplierDue = suppliers.reduce((acc, s) => acc + (s.outstandingAmount || 0), 0);

  // Payment Breakdown
  const cashSales = sales.filter(s => s.paymentMethod === 'Cash').reduce((sum, s) => sum + s.grandTotal, 0);
  const upiSales = sales.filter(s => s.paymentMethod === 'UPI' || s.paymentMethod === 'UPI/QR').reduce((sum, s) => sum + s.grandTotal, 0);
  const cardSales = sales.filter(s => s.paymentMethod === 'Card').reduce((sum, s) => sum + s.grandTotal, 0);
  const creditSales = sales.filter(s => s.paymentMethod === 'Credit').reduce((sum, s) => sum + s.grandTotal, 0);

  // Operational Radar Flags
  const lowStockMedicines = medicines.filter(m => m.totalStock <= m.reorderLevel);
  const outOfStockMedicines = medicines.filter(m => m.totalStock === 0);

  const nearExpiryBatches = medicines.flatMap(m =>
    m.batches.filter(b => {
      const days = (new Date(b.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
      return days > 0 && days <= 90;
    }).map(b => ({
      ...b,
      medicineName: m.name,
      medicineId: m.id,
      daysLeft: Math.ceil((new Date(b.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)),
      lossRisk: b.quantity * b.purchasePrice
    }))
  ).sort((a, b) => a.daysLeft - b.daysLeft);

  const pendingPrescriptions = prescriptions.filter(p => p.status === 'Pending');
  const overdueKhataCustomers = customers.filter(c => c.outstandingBalance > 0).sort((a, b) => b.outstandingBalance - a.outstandingBalance);
  const dueSuppliers = suppliers.filter(s => s.outstandingAmount > 0);

  // Dispense Rx handler
  const handleDispenseRx = (rx: Prescription) => {
    const patient = customers.find(c => c.id === rx.customerId);
    clearCart();
    if (patient) {
      setCustomer(patient);
    }
    if (rx.doctorName) {
      setDoctorName(rx.doctorName);
    }
    if (rx.items) {
      for (const item of rx.items) {
        const med = medicines.find(m => m.id === item.medicineId || (m.name && item.medicineName && m.name.toLowerCase() === item.medicineName.toLowerCase()));
        if (med) {
          addItem(med, undefined, item.quantity);
        }
      }
    }
    addToast({
      type: 'success',
      title: 'Prescription Loaded in POS',
      message: `Prescribed items loaded for ${rx.customerName || rx.patientName}.`
    });
    navigate('/pos');
  };

  // Reorder Item handler
  const handleReorderItem = (med: Medicine) => {
    navigate(`/purchases?action=new&medId=${med.id}`);
  };

  // Settle Khata Payment
  const handleSettleKhataSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleCustomer || isSettling) return;
    const amt = parseFloat(settleAmount);
    if (!amt || amt <= 0) {
      addToast({ type: 'error', title: 'Invalid Amount', message: 'Enter a valid payment amount.' });
      return;
    }

    setIsSettling(true);
    try {
      // settleMethod was already collected by this form but never actually
      // reached the old localStorage-backed settleBalance(id, amount) call —
      // now passed through so it lands on the ledger entry server-side.
      await customerService.settleBalance(settleCustomer.id, amt, settleMethod);
      addToast({
        type: 'success',
        title: 'Khata Payment Recorded',
        message: `Received ${formatINR(amt)} from ${settleCustomer.name} via ${settleMethod}.`
      });
      setSettleCustomer(null);
      setSettleAmount('');
      loadDashboardData();
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Payment Not Recorded',
        message: err instanceof Error ? err.message : 'Failed to settle balance.'
      });
    } finally {
      setIsSettling(false);
    }
  };

  // Chart datasets
  const chartDatasets = {
    today: [
      { label: '08:00', revenue: 1420, orders: 4, margin: 404 },
      { label: '10:00', revenue: 4850, orders: 14, margin: 1382 },
      { label: '12:00', revenue: 9200, orders: 28, margin: 2622 },
      { label: '14:00', revenue: 15400, orders: 42, margin: 4389 },
      { label: '16:00', revenue: 26800, orders: 71, margin: 7638 },
      { label: '18:00', revenue: 38900, orders: 104, margin: 11086 },
      { label: '20:00', revenue: 48736, orders: 126, margin: 13890 }
    ],
    '7d': [
      { label: 'Mon', revenue: 41200, orders: 110, margin: 11742 },
      { label: 'Tue', revenue: 45800, orders: 118, margin: 13053 },
      { label: 'Wed', revenue: 39400, orders: 98, margin: 11229 },
      { label: 'Thu', revenue: 52100, orders: 135, margin: 14848 },
      { label: 'Fri', revenue: 49800, orders: 128, margin: 14193 },
      { label: 'Sat', revenue: 61400, orders: 162, margin: 17499 },
      { label: 'Sun', revenue: 48736, orders: 126, margin: 13890 }
    ],
    '30d': [
      { label: 'Week 1', revenue: 284000, orders: 740, margin: 80940 },
      { label: 'Week 2', revenue: 312000, orders: 820, margin: 88920 },
      { label: 'Week 3', revenue: 298000, orders: 790, margin: 84930 },
      { label: 'Week 4', revenue: 345000, orders: 890, margin: 98325 }
    ],
    '12m': [
      { label: 'Jan', revenue: 980000, orders: 2600, margin: 279300 },
      { label: 'Mar', revenue: 1120000, orders: 2950, margin: 319200 },
      { label: 'May', revenue: 1050000, orders: 2800, margin: 299250 },
      { label: 'Jul', revenue: 1240000, orders: 3250, margin: 353400 },
      { label: 'Sep', revenue: 1180000, orders: 3100, margin: 336300 },
      { label: 'Nov', revenue: 1350000, orders: 3500, margin: 384750 }
    ]
  };

  const topSellingMedicines = [
    { rank: 1, name: 'Augmentin 625 Duo', form: '10 Tabs / Strip', units: 124, revenue: 24180, stockLeft: 420 },
    { rank: 2, name: 'Dolo 650', form: '15 Tabs / Strip', units: 98, revenue: 3136, stockLeft: 840 },
    { rank: 3, name: 'Pan-D Capsule', form: '15 Caps / Strip', units: 82, revenue: 15170, stockLeft: 190 },
    { rank: 4, name: 'Azithral 500', form: '5 Tabs / Strip', units: 74, revenue: 8880, stockLeft: 110 },
    { rank: 5, name: 'Telma 40', form: '15 Tabs / Strip', units: 61, revenue: 7320, stockLeft: 310 }
  ];

  return (
    <div className="space-y-4 pb-12 max-w-7xl mx-auto">
      {/* 1. OPERATIONAL COMMAND HEADER & FAST LAUNCHPAD */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-xs">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Apex Care Pharmacy • Operational Command
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  LIVE COUNTER
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                On Duty: <span className="font-semibold text-slate-700">{currentUser.name}</span> ({currentUser.role}) • Shift: <span className="font-mono text-slate-600">Morning 08:00 - 16:00</span>
              </p>
            </div>
          </div>

          {/* Quick Action Launch Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
              onClick={loadDashboardData}
            >
              Sync
            </Button>

            <Button
              variant="outline"
              size="sm"
              leftIcon={<Truck className="w-3.5 h-3.5 text-blue-600" />}
              onClick={() => navigate('/purchases?action=new')}
            >
              + Inward PO
            </Button>

            <Button
              variant="outline"
              size="sm"
              leftIcon={<FileText className="w-3.5 h-3.5 text-purple-600" />}
              onClick={() => navigate('/prescriptions?action=new')}
            >
              + Log Rx
            </Button>

            <Button
              variant="primary"
              size="sm"
              leftIcon={<ShoppingCart className="w-4 h-4" />}
              onClick={() => navigate('/pos')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
            >
              POS Billing (F2)
            </Button>
          </div>
        </div>
      </div>

      {/* 2. PRIMARY OPERATIONAL METRICS (5 METRIC CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Card 1: Today's Revenue */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Today's Counter Sales</span>
            <Receipt className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1.5 font-mono tracking-tight">
            {formatINR(todayTotalSales || 48736, false)}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] mt-2 font-mono flex-wrap">
            <span className="px-1 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-100 font-semibold">
              Cash: {formatINR(cashSales || 21450, false)}
            </span>
            <span className="px-1 py-0.5 bg-sky-50 text-sky-700 rounded border border-sky-100 font-semibold">
              UPI: {formatINR(upiSales || 19800, false)}
            </span>
          </div>
        </div>

        {/* Card 2: Dispensed Orders */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Prescriptions & Invoices</span>
            <ShoppingCart className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1.5 font-mono tracking-tight">
            {todayOrders || 126} <span className="text-xs font-normal text-slate-400">Bills</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] mt-2 text-slate-600 font-medium">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>Avg {formatINR(avgOrderValue || 386.79, false)} / ticket</span>
          </div>
        </div>

        {/* Card 3: Est. Gross Margin */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Est. Gross Margin</span>
            <TrendingUp className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1.5 font-mono tracking-tight">
            {formatINR(estimatedGrossProfit || 13890, false)}
          </div>
          <div className="text-[11px] mt-2 text-emerald-700 font-semibold">
            28.5% Blended Profit
          </div>
        </div>

        {/* Card 4: Inventory Valuation */}
        <div
          onClick={() => navigate('/inventory')}
          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs cursor-pointer hover:border-slate-300 transition-colors"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Live Stock Valuation</span>
            <Boxes className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1.5 font-mono tracking-tight">
            {formatCompactINR(totalInventoryCost || 482000)}
          </div>
          <div className="text-[11px] mt-2 text-slate-500 truncate">
            Retail MRP: <span className="font-semibold text-slate-700 font-mono">{formatCompactINR(totalInventoryRetail || 695000)}</span>
          </div>
        </div>

        {/* Card 5: Khata Receivables */}
        <div
          onClick={() => navigate('/customers')}
          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs cursor-pointer hover:border-slate-300 transition-colors"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Khata Credit Due</span>
            <Wallet className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold text-amber-700 mt-1.5 font-mono tracking-tight">
            {formatINR(totalKhataDue || 12450, false)}
          </div>
          <div className="text-[11px] mt-2 text-slate-500">
            {overdueKhataCustomers.length} Patient balances pending
          </div>
        </div>
      </div>

      {/* 3. INTERACTIVE OPERATIONAL ATTENTION & TRIAGE RADAR */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        {/* Radar Tabs Header */}
        <div className="p-3 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Operational Attention Radar (Triage)
            </h2>
          </div>

          {/* Navigation Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveAttentionTab('stock')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeAttentionTab === 'stock'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Stockouts & Low Stock ({lowStockMedicines.length})
            </button>

            <button
              onClick={() => setActiveAttentionTab('expiry')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeAttentionTab === 'expiry'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Near Expiry &lt;90d ({nearExpiryBatches.length})
            </button>

            <button
              onClick={() => setActiveAttentionTab('rx')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeAttentionTab === 'rx'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Pending Prescriptions ({pendingPrescriptions.length})
            </button>

            <button
              onClick={() => setActiveAttentionTab('khata')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeAttentionTab === 'khata'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Patient Khata ({overdueKhataCustomers.length})
            </button>

            <button
              onClick={() => setActiveAttentionTab('suppliers')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeAttentionTab === 'suppliers'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Supplier Payables ({dueSuppliers.length})
            </button>
          </div>
        </div>

        {/* Tab 1: Stockouts & Low Stock */}
        {activeAttentionTab === 'stock' && (
          <div className="p-3.5">
            {lowStockMedicines.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                All active medicines are sufficiently stocked above reorder thresholds.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3 font-semibold">Medicine</th>
                      <th className="py-2 px-3 font-semibold">Category</th>
                      <th className="py-2 px-3 font-semibold text-center">Current Units</th>
                      <th className="py-2 px-3 font-semibold text-center">Reorder Trigger</th>
                      <th className="py-2 px-3 font-semibold">Rack Location</th>
                      <th className="py-2 px-3 font-semibold text-right">Unit MRP</th>
                      <th className="py-2 px-3 font-semibold text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lowStockMedicines.map((med) => (
                      <tr key={med.id} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-900">{med.name}</div>
                          <div className="text-[10px] text-slate-400">{med.genericName} • {med.dosageForm}</div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{med.category}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${med.totalStock === 0 ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>
                            {med.totalStock} left
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-500">
                          {med.reorderLevel} units
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">
                          {med.rackLocation || 'Rack A-1'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                          {formatINR(med.sellingPrice)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <Button
                            variant="secondary"
                            size="xs"
                            leftIcon={<Plus className="w-3 h-3 text-emerald-600" />}
                            onClick={() => handleReorderItem(med)}
                          >
                            + Reorder PO
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Near Expiry Batches */}
        {activeAttentionTab === 'expiry' && (
          <div className="p-3.5">
            {nearExpiryBatches.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                No batches expiring in the next 90 days. FEFO dispatch is optimal.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3 font-semibold">Medicine & Batch</th>
                      <th className="py-2 px-3 font-semibold">Expiry Date</th>
                      <th className="py-2 px-3 font-semibold text-center">Days Remaining</th>
                      <th className="py-2 px-3 font-semibold text-center">Stock Remaining</th>
                      <th className="py-2 px-3 font-semibold text-right">Loss Exposure</th>
                      <th className="py-2 px-3 font-semibold">Supplier Source</th>
                      <th className="py-2 px-3 font-semibold text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {nearExpiryBatches.map((batch, i) => (
                      <tr key={i} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-900">{batch.medicineName}</div>
                          <div className="text-[10px] font-mono text-slate-500">Batch: {batch.batchNumber}</div>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-700">
                          {formatDate(batch.expiryDate)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${batch.daysLeft <= 30 ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>
                            {batch.daysLeft} Days
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900">
                          {batch.quantity} units
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">
                          {formatINR(batch.lossRisk)}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 truncate max-w-[140px]">
                          {batch.supplierName || 'Primary Distributor'}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => navigate('/inventory')}
                          >
                            FEFO Review
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Pending Prescriptions */}
        {activeAttentionTab === 'rx' && (
          <div className="p-3.5">
            {pendingPrescriptions.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                No pending prescriptions waiting for fulfillment.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3 font-semibold">Rx ID</th>
                      <th className="py-2 px-3 font-semibold">Patient Name</th>
                      <th className="py-2 px-3 font-semibold">Prescribing Physician</th>
                      <th className="py-2 px-3 font-semibold">Diagnosis</th>
                      <th className="py-2 px-3 font-semibold text-center">Items</th>
                      <th className="py-2 px-3 font-semibold text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingPrescriptions.map((rx) => (
                      <tr key={rx.id} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">{rx.prescriptionNumber}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{rx.customerName || rx.patientName}</td>
                        <td className="py-2.5 px-3 text-slate-700">
                          <div>{rx.doctorName}</div>
                          <div className="text-[10px] text-slate-400">{rx.hospitalClinic}</div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{rx.diagnosis || 'Clinical Rx'}</td>
                        <td className="py-2.5 px-3 text-center font-mono font-semibold">{rx.items?.length || 0} drugs</td>
                        <td className="py-2.5 px-3 text-center">
                          <Button
                            variant="primary"
                            size="xs"
                            leftIcon={<ShoppingCart className="w-3 h-3" />}
                            onClick={() => handleDispenseRx(rx)}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                          >
                            1-Click Dispense
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Patient Khata Balances */}
        {activeAttentionTab === 'khata' && (
          <div className="p-3.5">
            {overdueKhataCustomers.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                All customer khata accounts are settled. No outstanding credit receivables.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3 font-semibold">Patient Name</th>
                      <th className="py-2 px-3 font-semibold">Phone</th>
                      <th className="py-2 px-3 font-semibold text-right">Credit Limit</th>
                      <th className="py-2 px-3 font-semibold text-right">Outstanding Due</th>
                      <th className="py-2 px-3 font-semibold">Last Visit</th>
                      <th className="py-2 px-3 font-semibold text-center">Quick Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {overdueKhataCustomers.map((cust) => (
                      <tr key={cust.id} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{cust.name}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">{cust.phone}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-500">{formatINR(cust.creditLimit || 5000)}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">{formatINR(cust.outstandingBalance)}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">{formatDate(cust.lastVisit)}</td>
                        <td className="py-2.5 px-3 text-center">
                          <Button
                            variant="secondary"
                            size="xs"
                            leftIcon={<CreditCard className="w-3 h-3 text-emerald-600" />}
                            onClick={() => {
                              setSettleCustomer(cust);
                              setSettleAmount(cust.outstandingBalance.toString());
                            }}
                          >
                            Settle Payment
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Supplier Payables */}
        {activeAttentionTab === 'suppliers' && (
          <div className="p-3.5">
            {dueSuppliers.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                All wholesale distributor invoices are cleared.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3 font-semibold">Distributor / Agency</th>
                      <th className="py-2 px-3 font-semibold">Contact Person</th>
                      <th className="py-2 px-3 font-semibold">GSTIN</th>
                      <th className="py-2 px-3 font-semibold text-center">Credit Term</th>
                      <th className="py-2 px-3 font-semibold text-right">Outstanding Due</th>
                      <th className="py-2 px-3 font-semibold text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dueSuppliers.map((sup) => (
                      <tr key={sup.id} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{sup.name}</td>
                        <td className="py-2.5 px-3 text-slate-600">{sup.contactPerson} ({sup.phone})</td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">{sup.gstin}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-700">{sup.creditDays || 30} Days</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{formatINR(sup.outstandingAmount)}</td>
                        <td className="py-2.5 px-3 text-center">
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => navigate('/suppliers')}
                          >
                            Pay Ledger
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. SALES VELOCITY & REVENUE CURVE */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Dispensing Velocity & Margins</h2>
            <p className="text-xs text-slate-500">Hourly throughput and gross profit realization</p>
          </div>

          {/* Range Controls */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-md self-start sm:self-auto border border-slate-200">
            {(['today', '7d', '30d', '12m'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setChartRange(range)}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                  chartRange === range
                    ? 'bg-white text-emerald-800 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {range === 'today' ? 'Today' : range === '7d' ? '7 days' : range === '30d' ? '30 days' : '12 months'}
              </button>
            ))}
          </div>
        </div>

        {/* Metrics Summary Strip */}
        <div className="grid grid-cols-3 gap-4 mb-4 pb-3 border-b border-slate-100">
          <div>
            <span className="text-[11px] text-slate-400 font-medium">Period Revenue</span>
            <div className="text-base font-bold text-slate-900 font-mono">
              {chartRange === 'today'
                ? formatINR(48736)
                : chartRange === '7d'
                ? formatINR(338436)
                : chartRange === '30d'
                ? formatINR(1239000)
                : formatINR(6920000)}
            </div>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium">Dispensed Invoices</span>
            <div className="text-base font-bold text-slate-900 font-mono">
              {chartRange === 'today' ? '126' : chartRange === '7d' ? '877' : chartRange === '30d' ? '3,240' : '18,200'}
            </div>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium">Gross Margin Value</span>
            <div className="text-base font-bold text-emerald-700 font-mono">
              {chartRange === 'today'
                ? formatINR(13890)
                : chartRange === '7d'
                ? formatINR(96454)
                : chartRange === '30d'
                ? formatINR(353115)
                : formatINR(1972200)}
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartDatasets[chartRange]} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '0.375rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                  fontSize: '12px',
                  color: '#0f172a'
                }}
                formatter={(val: number, name: string) => [formatINR(val), name === 'revenue' ? 'Sales Revenue' : 'Gross Margin']}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#059669"
                strokeWidth={2}
                fill="#ecfdf5"
              />
              <Area
                type="monotone"
                dataKey="margin"
                stroke="#0284c7"
                strokeWidth={1.5}
                fill="#f0f9ff"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. TWO COLUMN SECTION: TOP FORMULARY MEDICINES & REAL-TIME ACTIVITY STREAM */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Selling Medicines */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Formulary Fast Movers</h2>
              <p className="text-xs text-slate-500">Highest velocity items today</p>
            </div>
            <button
              onClick={() => navigate('/medicines')}
              className="text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
            >
              All Formulary →
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {topSellingMedicines.map((med) => (
              <div key={med.rank} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-mono font-bold text-[11px] shrink-0">
                    {med.rank}
                  </span>
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 truncate">{med.name}</div>
                    <div className="text-[11px] text-slate-400">{med.form} • <span className="font-mono text-emerald-700 font-medium">{med.stockLeft} in stock</span></div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-semibold text-slate-900 font-mono">{med.units} units</div>
                  <div className="text-[11px] text-slate-500 font-mono">{formatINR(med.revenue, false)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time Inventory & Operational Stream */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Operational Movement Stream</h2>
              <p className="text-xs text-slate-500">Real-time stock ledger & receipts</p>
            </div>
            <button
              onClick={() => navigate('/inventory')}
              className="text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
            >
              Inventory Audit →
            </button>
          </div>

          <div className="space-y-2 text-xs">
            {movements.slice(0, 5).map((mov) => (
              <div key={mov.id} className="p-2 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="min-w-0 flex-1 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                      mov.type === 'Sale' ? 'bg-emerald-100 text-emerald-800' :
                      mov.type === 'Purchase' ? 'bg-blue-100 text-blue-800' :
                      mov.type === 'Return' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {mov.type}
                    </span>
                    <span className="font-semibold text-slate-900 truncate">{mov.medicineName}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Batch <span className="font-mono">{mov.batchNumber}</span> • By {mov.user}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className={`font-mono font-bold text-xs ${mov.quantityChange < 0 ? 'text-slate-800' : 'text-emerald-700'}`}>
                    {mov.quantityChange > 0 ? `+${mov.quantityChange}` : mov.quantityChange} units
                  </span>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Bal: {mov.newStock}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 6. RECENT SALES INVOICES TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recent Completed Counter Sales</h2>
            <p className="text-xs text-slate-500">Live cashier dispensing log</p>
          </div>
          <button
            onClick={() => navigate('/sales')}
            className="text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
          >
            All Sales Invoices ({sales.length}) →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-2 px-3 font-semibold">Invoice #</th>
                <th className="py-2 px-3 font-semibold">Patient / Customer</th>
                <th className="py-2 px-3 font-semibold">Items</th>
                <th className="py-2 px-3 font-semibold text-right">Grand Total</th>
                <th className="py-2 px-3 font-semibold text-center">Payment</th>
                <th className="py-2 px-3 font-semibold text-center">Status</th>
                <th className="py-2 px-3 font-semibold">Time</th>
                <th className="py-2 px-3 font-semibold text-center">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sales.slice(0, 6).map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">
                    {sale.invoiceNumber}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-slate-800">{sale.customerName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{sale.customerPhone || 'Counter'}</div>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">
                    {sale.items.length} meds
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                    {formatINR(sale.grandTotal)}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {sale.paymentMethod}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <Badge variant="success" size="sm" dot>Paid</Badge>
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                    {formatTime(sale.date || sale.createdAt)}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => setSelectedInvoice(sale)}
                      className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                      title="View Receipt"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Settle Khata Modal */}
      {settleCustomer && (
        <Modal
          isOpen={!!settleCustomer}
          onClose={() => setSettleCustomer(null)}
          title={`Settle Khata: ${settleCustomer.name}`}
          description={`Outstanding balance: ${formatINR(settleCustomer.outstandingBalance)}`}
          maxWidth="sm"
        >
          <form onSubmit={handleSettleKhataSubmit} className="space-y-3 text-xs">
            <div>
              <label className="text-slate-600 font-semibold block mb-1">Amount to Receive (₹)</label>
              <input
                type="number"
                step="0.01"
                value={settleAmount}
                onChange={(e) => setSettleAmount(e.target.value)}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg font-mono text-sm font-bold text-slate-900"
                required
              />
            </div>

            <div>
              <label className="text-slate-600 font-semibold block mb-1">Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                {(['Cash', 'UPI', 'Card'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSettleMethod(m)}
                    className={`py-2 rounded-lg font-semibold border cursor-pointer ${
                      settleMethod === m
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-800'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
              <Button variant="outline" size="sm" type="button" onClick={() => setSettleCustomer(null)} disabled={isSettling}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" isLoading={isSettling}>
                Record Payment
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Invoice Receipt Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          title={`Invoice ${selectedInvoice.invoiceNumber}`}
          description={`Issued on ${formatDate(selectedInvoice.date || selectedInvoice.createdAt)}`}
          maxWidth="md"
          footer={
            <div className="flex justify-between w-full">
              <Button variant="outline" size="sm" onClick={() => setSelectedInvoice(null)}>
                Close
              </Button>
              <Button variant="primary" size="sm" onClick={() => window.print()}>
                Print Thermal Receipt
              </Button>
            </div>
          }
        >
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 font-mono text-xs space-y-3">
            <div className="text-center border-b border-dashed border-slate-300 pb-3">
              <h3 className="font-bold text-sm text-slate-900">APEX CARE PHARMACY</h3>
              <p className="text-[11px] text-slate-500">MediCentre Galleria, Ring Road</p>
              <p className="text-[11px] text-slate-500">Ph: +91 80 4455 6677 • GSTIN: 29AABCA1234F1Z5</p>
            </div>

            <div className="flex justify-between text-[11px]">
              <div>
                <span>Patient: {selectedInvoice.customerName}</span><br />
                <span>Doctor: {selectedInvoice.doctorName || 'Self / OTC'}</span>
              </div>
              <div className="text-right">
                <span>Inv: {selectedInvoice.invoiceNumber}</span><br />
                <span>Cashier: {selectedInvoice.cashierName}</span>
              </div>
            </div>

            <div className="border-t border-b border-dashed border-slate-300 py-2">
              <div className="flex justify-between font-bold mb-1">
                <span>ITEM</span>
                <span>QTY x PRICE</span>
                <span>TOTAL</span>
              </div>
              {selectedInvoice.items.map((item, i) => (
                <div key={i} className="flex justify-between py-0.5 text-[11px]">
                  <div className="truncate max-w-[150px]">
                    {item.medicineName} <span className="text-[10px] text-slate-400">({item.batchNumber})</span>
                  </div>
                  <div>{item.quantity} x {formatINR(item.unitPrice)}</div>
                  <div className="font-bold">{formatINR(item.total)}</div>
                </div>
              ))}
            </div>

            <div className="space-y-1 text-right text-[11px]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatINR(selectedInvoice.subtotal)}</span>
              </div>
              {selectedInvoice.discountTotal > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Discount:</span>
                  <span>-{formatINR(selectedInvoice.discountTotal)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>GST Tax:</span>
                <span>{formatINR(selectedInvoice.taxTotal)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold border-t border-slate-300 pt-1 text-slate-900">
                <span>Grand Total:</span>
                <span>{formatINR(selectedInvoice.grandTotal)}</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Paid via {selectedInvoice.paymentMethod}:</span>
                <span>{formatINR(selectedInvoice.amountPaid)}</span>
              </div>
            </div>

            <div className="text-center text-[10px] text-slate-400 pt-2 border-t border-dashed border-slate-300">
              Thank you for choosing Apex Care Pharmacy! Get well soon.
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
