import * as reportsApi from '../api/reports';
import {
  CategoryDistributionItem,
  GstReport,
  MonthlyTrendItem,
  ProfitAndLossReport,
  SalesSummaryReport,
  TopMedicineItem
} from '../types';

/**
 * Every figure returned here is a real backend aggregation (server/src/services/reportService.ts) —
 * this adapter does not compute, estimate, or recombine any financial value.
 * Report values intentionally include sales regardless of status (Completed/
 * Refunded/Partially Refunded) — an approved Phase J decision, not altered here.
 */
class ReportService {
  async getSalesSummary(params: reportsApi.DateRangeParams = {}): Promise<SalesSummaryReport> {
    return reportsApi.getSalesSummary(params);
  }

  async getProfitAndLoss(params: reportsApi.DateRangeParams = {}): Promise<ProfitAndLossReport> {
    return reportsApi.getProfitAndLoss(params);
  }

  async getGstReport(params: reportsApi.DateRangeParams = {}): Promise<GstReport> {
    return reportsApi.getGstReport(params);
  }

  async getCategoryDistribution(): Promise<CategoryDistributionItem[]> {
    return reportsApi.getCategoryDistribution();
  }

  async getMonthlyTrend(months = 6): Promise<MonthlyTrendItem[]> {
    return reportsApi.getMonthlyTrend(months);
  }

  async getTopMedicines(params: reportsApi.DateRangeParams & { limit?: number } = {}): Promise<TopMedicineItem[]> {
    return reportsApi.getTopMedicines(params);
  }
}

export const reportService = new ReportService();
