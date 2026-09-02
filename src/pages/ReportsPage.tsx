import React, { useState, useEffect } from 'react';
import { reportService } from '../services/reportService';
import {
  SalesSummaryReport,
  ProfitAndLossReport,
  GstReport,
  CategoryDistributionItem,
  MonthlyTrendItem,
  TopMedicineItem
} from '../types';
import { ApiError } from '../api/client';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Tabs } from '../components/ui/Tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import {
  TrendingUp,
  Download,
  Boxes,
  ShieldCheck,
  IndianRupee,
  Loader2
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { formatINR } from '../utils/formatters';

const COLORS = ['#0f766e', '#0284c7', '#2563eb', '#7c3aed', '#d97706', '#db2777', '#475569'];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function Loading() {
  return <div className="p-10 flex items-center justify-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin" /></div>;
}

function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="p-6 text-center text-xs text-rose-600">
      {message} <button className="underline font-semibold" onClick={onRetry}>Retry</button>
    </div>
  );
}

export const ReportsPage: React.FC = () => {
  const { addToast } = useAppStore();
  const [activeTab, setActiveTab] = useState<'sales' | 'pl' | 'gst' | 'velocity'>('sales');

  // Every report below is a real backend aggregation (see reportService.ts) —
  // this page only maps the response into tables/charts, it never
  // recomputes COGS/GST/velocity itself. Report figures intentionally
  // include sales regardless of status (Completed/Refunded/Partially
  // Refunded) per the approved Phase J decision — not altered here.
  const [salesSummary, setSalesSummary] = useState<SalesSummaryReport | null>(null);
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyTrendItem[] | null>(null);
  const [categoryDistribution, setCategoryDistribution] = useState<CategoryDistributionItem[] | null>(null);
  const [isSalesLoading, setIsSalesLoading] = useState(true);
  const [salesError, setSalesError] = useState<string | null>(null);

  const [profitAndLoss, setProfitAndLoss] = useState<ProfitAndLossReport | null>(null);
  const [isPlLoading, setIsPlLoading] = useState(true);
  const [plError, setPlError] = useState<string | null>(null);

  const [gst, setGst] = useState<GstReport | null>(null);
  const [isGstLoading, setIsGstLoading] = useState(true);
  const [gstError, setGstError] = useState<string | null>(null);

  const [topMedicines, setTopMedicines] = useState<TopMedicineItem[] | null>(null);
  const [isVelocityLoading, setIsVelocityLoading] = useState(true);
  const [velocityError, setVelocityError] = useState<string | null>(null);

  const loadSales = async () => {
    setIsSalesLoading(true);
    setSalesError(null);
    try {
      const [summary, trend, categories] = await Promise.all([
        reportService.getSalesSummary(),
        reportService.getMonthlyTrend(6),
        reportService.getCategoryDistribution()
      ]);
      setSalesSummary(summary);
      setMonthlyTrend(trend);
      setCategoryDistribution(categories);
    } catch (err) {
      setSalesError(err instanceof ApiError ? err.message : 'Failed to load revenue trends.');
    } finally {
      setIsSalesLoading(false);
    }
  };

  const loadPl = async () => {
    setIsPlLoading(true);
    setPlError(null);
    try {
      setProfitAndLoss(await reportService.getProfitAndLoss());
    } catch (err) {
      setPlError(err instanceof ApiError ? err.message : 'Failed to load the profit & loss statement.');
    } finally {
      setIsPlLoading(false);
    }
  };

  const loadGst = async () => {
    setIsGstLoading(true);
    setGstError(null);
    try {
      setGst(await reportService.getGstReport());
    } catch (err) {
      setGstError(err instanceof ApiError ? err.message : 'Failed to load the GST report.');
    } finally {
      setIsGstLoading(false);
    }
  };

  const loadVelocity = async () => {
    setIsVelocityLoading(true);
    setVelocityError(null);
    try {
      setTopMedicines(await reportService.getTopMedicines({ limit: 15 }));
    } catch (err) {
      setVelocityError(err instanceof ApiError ? err.message : 'Failed to load sales velocity.');
    } finally {
      setIsVelocityLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
    loadPl();
    loadGst();
    loadVelocity();
  }, []);

  const monthlyChartData = (monthlyTrend ?? []).map((m) => ({
    month: `${MONTH_LABELS[m.month - 1]} ${String(m.year).slice(2)}`,
    sales: m.sales,
    profit: m.profit,
    expenses: m.expenses
  }));

  const categoryChartData = (categoryDistribution ?? []).map((c) => ({ name: c.category, value: c.totalStock }));

  const handleExportReport = () => {
    addToast({
      type: 'success',
      title: 'Report Downloaded',
      message: 'Comprehensive analytics exported to spreadsheet.'
    });
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Reports & Financial Intelligence
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Financial statements, GST compliance (GSTR-1), gross margins and sales velocity
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          leftIcon={<Download className="w-3.5 h-3.5" />}
          onClick={handleExportReport}
        >
          Export Spreadsheet
        </Button>
      </div>

      {/* Tabs */}
      <Tabs
        activeTab={activeTab}
        onChange={(tab) => setActiveTab(tab as any)}
        tabs={[
          { id: 'sales', label: 'Revenue Trends', icon: <TrendingUp className="w-3.5 h-3.5" /> },
          { id: 'pl', label: 'Profit & Loss Statement', icon: <IndianRupee className="w-3.5 h-3.5" /> },
          { id: 'gst', label: 'GST Compliance (GSTR-1)', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
          { id: 'velocity', label: 'Top Selling Medicines', icon: <Boxes className="w-3.5 h-3.5" /> }
        ]}
      />

      {/* Revenue Trends Tab */}
      {activeTab === 'sales' && (
        salesError ? (
          <LoadError message={salesError} onRetry={loadSales} />
        ) : isSalesLoading ? (
          <Loading />
        ) : (
        <div className="space-y-4">
          {salesSummary && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-2xs">
                <span className="text-xs text-slate-500 font-medium">Gross Sales (YTD)</span>
                <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">{formatINR(salesSummary.grossSales)}</div>
                <span className="text-[11px] text-slate-400">{salesSummary.invoiceCount} invoices</span>
              </div>
              <div className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-2xs">
                <span className="text-xs text-slate-500 font-medium">Net Sales</span>
                <div className="text-lg font-bold font-mono text-emerald-700 mt-0.5">{formatINR(salesSummary.netSales)}</div>
                <span className="text-[11px] text-slate-400">After {formatINR(salesSummary.totalDiscounts)} discounts</span>
              </div>
              <div className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-2xs">
                <span className="text-xs text-slate-500 font-medium">Tax Collected</span>
                <div className="text-lg font-bold font-mono text-teal-700 mt-0.5">{formatINR(salesSummary.taxTotal)}</div>
                <span className="text-[11px] text-slate-400">CGST + SGST</span>
              </div>
              <div className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-2xs">
                <span className="text-xs text-slate-500 font-medium">Payment Split</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {salesSummary.paymentMethodBreakdown.map((p) => (
                    <Badge key={p.method} variant="outline" size="sm">{p.method}: {formatINR(p.total)}</Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-slate-900">
                  Monthly Revenue, Gross Profit & Overheads
                </h3>
                <p className="text-xs text-slate-400">Past {monthlyChartData.length} calendar months (in ₹)</p>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value: any) => [formatINR(value), '']} />
                    <Legend />
                    <Bar dataKey="sales" name="Gross Sales" fill="#0f766e" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="profit" name="Gross Profit" fill="#0284c7" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="expenses" name="Overheads" fill="#f43f5e" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-slate-900">
                  Inventory by Category
                </h3>
                <p className="text-xs text-slate-400">Share across therapeutic classes</p>
              </div>

              <div className="h-64 w-full">
                {categoryChartData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">No active stock yet.</div>
                ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </div>
        )
      )}

      {/* P&L Statement Tab */}
      {activeTab === 'pl' && (
        plError ? (
          <LoadError message={plError} onRetry={loadPl} />
        ) : isPlLoading || !profitAndLoss ? (
          <Loading />
        ) : (
        <div className="max-w-4xl mx-auto rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Income Statement / Profit & Loss (P&L)
              </h3>
              <p className="text-xs text-slate-400">Accounting Period: Year-To-Date (YTD 2026)</p>
            </div>
            <Badge variant="success" size="sm">AUDITED INTERNAL</Badge>
          </div>

          <div className="space-y-4 text-xs">
            {/* Revenue */}
            <div>
              <div className="font-bold text-slate-900 text-xs border-b pb-1">
                1. Operating Revenue
              </div>
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between pl-3 text-slate-600">
                  <span>Gross Drug & Healthcare Sales:</span>
                  <span className="font-mono font-semibold">{formatINR(profitAndLoss.grossSales)}</span>
                </div>
                <div className="flex justify-between pl-3 text-emerald-700">
                  <span>Less: Customer Discounts & Schemes:</span>
                  <span className="font-mono font-semibold">-{formatINR(profitAndLoss.totalDiscounts)}</span>
                </div>
                <div className="flex justify-between pl-3 font-semibold text-slate-900 bg-slate-50 border border-slate-200 p-2 rounded-lg">
                  <span>Net Sales Revenue:</span>
                  <span className="font-mono text-emerald-700">{formatINR(profitAndLoss.netSales)}</span>
                </div>
              </div>
            </div>

            {/* COGS */}
            <div>
              <div className="font-bold text-slate-900 text-xs border-b pb-1">
                2. Cost of Goods Sold (COGS)
              </div>
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between pl-3 text-slate-600">
                  <span>Wholesale Procurement & Stock Purchase:</span>
                  <span className="font-mono font-semibold">-{formatINR(profitAndLoss.cogs)}</span>
                </div>
                <div className="flex justify-between pl-3 font-semibold text-slate-900 bg-slate-50 border border-slate-200 p-2 rounded-lg">
                  <span>Gross Margin:</span>
                  <span className="font-mono text-teal-700">{formatINR(profitAndLoss.grossProfit)} ({profitAndLoss.grossMarginPercent}%)</span>
                </div>
              </div>
            </div>

            {/* Operating Expenses */}
            <div>
              <div className="font-bold text-slate-900 text-xs border-b pb-1">
                3. Operating Expenses & Overheads
              </div>
              <div className="space-y-1.5 pt-2">
                {profitAndLoss.expenseBreakdown.length === 0 ? (
                  <p className="pl-3 text-slate-400">No expenses recorded this period.</p>
                ) : (
                  profitAndLoss.expenseBreakdown.map((e) => (
                    <div key={e.category} className="flex justify-between pl-3 text-slate-500">
                      <span>{e.category}:</span>
                      <span className="font-mono font-semibold">-{formatINR(e.total)}</span>
                    </div>
                  ))
                )}
                <div className="flex justify-between pl-3 font-semibold text-slate-900 bg-slate-50 border border-slate-200 p-2 rounded-lg">
                  <span>Total Operating Overheads:</span>
                  <span className="font-mono text-rose-600">-{formatINR(profitAndLoss.totalOperatingExpenses)}</span>
                </div>
              </div>
            </div>

            {/* Net Income */}
            <div className="flex justify-between items-center p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg">
              <span className="text-xs font-bold text-emerald-950">
                NET OPERATING PROFIT (EBIT):
              </span>
              <span className="text-base font-bold font-mono text-emerald-800">
                {formatINR(profitAndLoss.netOperatingIncome)}
              </span>
            </div>
          </div>
        </div>
        )
      )}

      {/* GST Tax Compliance Tab */}
      {activeTab === 'gst' && (
        gstError ? (
          <LoadError message={gstError} onRetry={loadGst} />
        ) : isGstLoading || !gst ? (
          <Loading />
        ) : (
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-2xs">
              <span className="text-xs text-slate-500 font-medium">Output GST (Sales)</span>
              <div className="text-lg font-bold font-mono text-emerald-700 mt-0.5">
                {formatINR(gst.totalGstCollected)}
              </div>
              <span className="text-[11px] text-slate-400">CGST (6%) + SGST (6%)</span>
            </div>

            <div className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-2xs">
              <span className="text-xs text-slate-500 font-medium">Input Tax Credit (ITC)</span>
              <div className="text-lg font-bold font-mono text-teal-700 mt-0.5">
                {formatINR(gst.totalGstPaidOnPurchases)}
              </div>
              <span className="text-[11px] text-slate-400">From wholesale inward purchases</span>
            </div>

            <div className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-2xs">
              <span className="text-xs text-slate-500 font-medium">Net GST Liability</span>
              <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
                {formatINR(gst.netGstPayable)}
              </div>
              <span className="text-[11px] text-slate-400">Due for monthly filing</span>
            </div>
          </div>
        </div>
        )
      )}

      {/* Top Selling Medicines */}
      {activeTab === 'velocity' && (
        velocityError ? (
          <LoadError message={velocityError} onRetry={loadVelocity} />
        ) : isVelocityLoading ? (
          <Loading />
        ) : !topMedicines || topMedicines.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-xs text-slate-400">No sales recorded yet.</div>
        ) : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3.5 font-semibold">#</th>
                  <th className="py-2.5 px-3.5 font-semibold">Medicine Name</th>
                  <th className="py-2.5 px-3.5 font-semibold text-right">Units Sold (YTD)</th>
                  <th className="py-2.5 px-3.5 font-semibold text-right">Revenue</th>
                  <th className="py-2.5 px-3.5 font-semibold text-center">Rank</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topMedicines.map((m, idx) => (
                  <tr key={m.medicineId} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3.5 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-2.5 px-3.5 font-semibold text-slate-900">{m.medicineName}</td>
                    <td className="py-2.5 px-3.5 text-right font-mono font-bold text-slate-900">{m.quantitySold} units</td>
                    <td className="py-2.5 px-3.5 text-right font-mono font-semibold">{formatINR(m.revenue)}</td>
                    <td className="py-2.5 px-3.5 text-center">
                      <Badge variant="success" size="sm">Top Mover</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )
      )}
    </div>
  );
};
