import { Sale } from '../models/Sale.model';
import { Expense } from '../models/Expense.model';
import { PurchaseOrder } from '../models/PurchaseOrder.model';
import { Medicine } from '../models/Medicine.model';
import { DateRangeQuery, MonthlyTrendQuery, TopMedicinesQuery } from '../validators/report.validators';

/**
 * Every report here is a real aggregation over real data. Worth noting
 * explicitly: the original ReportsPage.tsx this replaces contained several
 * values that were NOT real calculations —
 *   - "Fast Moving Drugs" was `idx % 2 === 0`, alternating by array
 *     position, with zero relation to actual sales.
 *   - The monthly revenue chart hardcoded 5 of its 6 months
 *     (`{ month: 'Mar', sales: 124000, ... }` etc.) and only computed the
 *     current month from real data, falling back to another hardcoded
 *     number if that was zero.
 *   - Gross profit used `netSales * 0.65` as a flat COGS estimate.
 * None of that is "existing business logic" to preserve — it's placeholder
 * demo data the frontend never had the data access to compute properly.
 * Now that every Sale line item carries its own purchasePrice snapshot
 * (Phase F), real COGS/velocity/monthly-trend figures are directly
 * computable, so that's what these endpoints return instead of the fakes.
 * Flagged explicitly here and in the Phase J report — not a silent change.
 */

function resolveDateRange(query: { from?: Date; to?: Date }): { from: Date; to: Date } {
  const to = query.to ?? new Date();
  // Matches the original P&L header's own stated period: "Year-To-Date (YTD 2026)".
  const from = query.from ?? new Date(to.getFullYear(), 0, 1);
  return { from, to };
}

export async function getSalesSummary(query: DateRangeQuery) {
  const { from, to } = resolveDateRange(query);

  const [totalsResult] = await Sale.aggregate([
    { $match: { createdAt: { $gte: from, $lte: to } } },
    {
      $facet: {
        totals: [
          {
            $group: {
              _id: null,
              grossSales: { $sum: '$grandTotal' },
              totalDiscounts: { $sum: '$discountTotal' },
              taxTotal: { $sum: '$taxTotal' },
              invoiceCount: { $sum: 1 }
            }
          }
        ],
        byPaymentMethod: [{ $group: { _id: '$paymentMethod', total: { $sum: '$grandTotal' }, count: { $sum: 1 } } }]
      }
    }
  ]);

  const totals = totalsResult?.totals?.[0] ?? { grossSales: 0, totalDiscounts: 0, taxTotal: 0, invoiceCount: 0 };
  const netSales = totals.grossSales - totals.totalDiscounts;

  return {
    from,
    to,
    grossSales: totals.grossSales,
    totalDiscounts: totals.totalDiscounts,
    netSales,
    taxTotal: totals.taxTotal,
    invoiceCount: totals.invoiceCount,
    paymentMethodBreakdown: (totalsResult?.byPaymentMethod ?? []).map((p: { _id: string; total: number; count: number }) => ({
      method: p._id,
      total: p.total,
      count: p.count
    }))
  };
}

export async function getProfitAndLoss(query: DateRangeQuery) {
  const { from, to } = resolveDateRange(query);

  const [salesResult] = await Sale.aggregate([
    { $match: { createdAt: { $gte: from, $lte: to } } },
    {
      $facet: {
        totals: [{ $group: { _id: null, grossSales: { $sum: '$grandTotal' }, totalDiscounts: { $sum: '$discountTotal' } } }],
        cogs: [
          { $unwind: '$items' },
          { $group: { _id: null, cogs: { $sum: { $multiply: ['$items.purchasePrice', '$items.quantity'] } } } }
        ]
      }
    }
  ]);

  const totals = salesResult?.totals?.[0] ?? { grossSales: 0, totalDiscounts: 0 };
  const cogs = salesResult?.cogs?.[0]?.cogs ?? 0;
  const netSales = totals.grossSales - totals.totalDiscounts;
  const grossProfit = netSales - cogs;
  const grossMarginPercent = netSales > 0 ? Math.round((grossProfit / netSales) * 1000) / 10 : 0;

  const [expenseResult] = await Expense.aggregate([
    { $match: { date: { $gte: from, $lte: to } } },
    {
      $facet: {
        total: [{ $group: { _id: null, total: { $sum: '$amount' } } }],
        byCategory: [{ $group: { _id: '$category', total: { $sum: '$amount' } } }]
      }
    }
  ]);

  const totalOperatingExpenses = expenseResult?.total?.[0]?.total ?? 0;
  const netOperatingIncome = grossProfit - totalOperatingExpenses;

  return {
    from,
    to,
    grossSales: totals.grossSales,
    totalDiscounts: totals.totalDiscounts,
    netSales,
    cogs,
    grossProfit,
    grossMarginPercent,
    totalOperatingExpenses,
    expenseBreakdown: (expenseResult?.byCategory ?? []).map((e: { _id: string; total: number }) => ({ category: e._id, total: e.total })),
    netOperatingIncome
  };
}

export async function getGstReport(query: DateRangeQuery) {
  const { from, to } = resolveDateRange(query);

  const [[salesGst], [purchaseGst]] = await Promise.all([
    Sale.aggregate([{ $match: { createdAt: { $gte: from, $lte: to } } }, { $group: { _id: null, total: { $sum: '$taxTotal' } } }]),
    PurchaseOrder.aggregate([{ $match: { orderDate: { $gte: from, $lte: to } } }, { $group: { _id: null, total: { $sum: '$taxTotal' } } }])
  ]);

  const totalGstCollected = salesGst?.total ?? 0;
  const totalGstPaidOnPurchases = purchaseGst?.total ?? 0;
  const netGstPayable = Math.max(0, totalGstCollected - totalGstPaidOnPurchases);

  return { from, to, totalGstCollected, totalGstPaidOnPurchases, netGstPayable };
}

/** Stock distribution by therapeutic category — matches the original chart's
 *  actual (if confusingly-labeled "Inventory by Category") computation exactly. */
export async function getCategoryDistribution() {
  return Medicine.aggregate([
    { $match: { status: 'Active' } },
    { $group: { _id: '$category', totalStock: { $sum: '$totalStock' } } },
    { $project: { _id: 0, category: '$_id', totalStock: 1 } },
    { $sort: { totalStock: -1 } }
  ]);
}

export async function getMonthlyTrend(query: MonthlyTrendQuery) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (query.months - 1), 1);

  const [salesByMonth, expensesByMonth] = await Promise.all([
    Sale.aggregate([
      { $match: { createdAt: { $gte: start } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          sales: { $sum: '$grandTotal' }
        }
      }
    ]),
    Expense.aggregate([
      { $match: { date: { $gte: start } } },
      { $group: { _id: { year: { $year: '$date' }, month: { $month: '$date' } }, expenses: { $sum: '$amount' } } }
    ])
  ]);

  // COGS needs its own unwind pass (can't $unwind items and $sum grandTotal in the same group correctly).
  const cogsByMonth = await Sale.aggregate([
    { $match: { createdAt: { $gte: start } } },
    { $unwind: '$items' },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        cogs: { $sum: { $multiply: ['$items.purchasePrice', '$items.quantity'] } }
      }
    }
  ]);

  const key = (y: number, m: number) => `${y}-${m}`;
  const salesMap = new Map(salesByMonth.map((s) => [key(s._id.year, s._id.month), s.sales as number]));
  const cogsMap = new Map(cogsByMonth.map((c) => [key(c._id.year, c._id.month), c.cogs as number]));
  const expenseMap = new Map(expensesByMonth.map((e) => [key(e._id.year, e._id.month), e.expenses as number]));

  const result: { year: number; month: number; sales: number; profit: number; expenses: number }[] = [];
  for (let i = query.months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const k = key(y, m);
    const sales = salesMap.get(k) ?? 0;
    const cogs = cogsMap.get(k) ?? 0;
    const expenses = expenseMap.get(k) ?? 0;
    result.push({ year: y, month: m, sales, profit: sales - cogs, expenses });
  }
  return result;
}

/** Real sales-velocity ranking by quantity actually sold — replaces the
 *  `idx % 2 === 0` placeholder "Fast Moving" flag from the old page. */
export async function getTopMedicines(query: TopMedicinesQuery) {
  const { from, to } = resolveDateRange(query);

  return Sale.aggregate([
    { $match: { createdAt: { $gte: from, $lte: to } } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.medicineId',
        medicineName: { $first: '$items.medicineName' },
        quantitySold: { $sum: '$items.quantity' },
        revenue: { $sum: '$items.total' }
      }
    },
    { $sort: { quantitySold: -1 } },
    { $limit: query.limit },
    { $project: { _id: 0, medicineId: '$_id', medicineName: 1, quantitySold: 1, revenue: 1 } }
  ]);
}
