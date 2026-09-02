import { apiGet } from './client';
import {
  CategoryDistributionItem,
  GstReport,
  MonthlyTrendItem,
  ProfitAndLossReport,
  SalesSummaryReport,
  TopMedicineItem
} from '../types';

export interface DateRangeParams {
  from?: string;
  to?: string;
}

export async function getSalesSummary(params: DateRangeParams = {}): Promise<SalesSummaryReport> {
  return apiGet<SalesSummaryReport>('/reports/sales-summary', { ...params });
}
export async function getProfitAndLoss(params: DateRangeParams = {}): Promise<ProfitAndLossReport> {
  return apiGet<ProfitAndLossReport>('/reports/profit-loss', { ...params });
}
export async function getGstReport(params: DateRangeParams = {}): Promise<GstReport> {
  return apiGet<GstReport>('/reports/gst', { ...params });
}
export async function getCategoryDistribution(): Promise<CategoryDistributionItem[]> {
  return apiGet<CategoryDistributionItem[]>('/reports/category-distribution');
}
export async function getMonthlyTrend(months = 6): Promise<MonthlyTrendItem[]> {
  return apiGet<MonthlyTrendItem[]>('/reports/monthly-trend', { months });
}
export async function getTopMedicines(params: DateRangeParams & { limit?: number } = {}): Promise<TopMedicineItem[]> {
  return apiGet<TopMedicineItem[]>('/reports/top-medicines', { ...params });
}
