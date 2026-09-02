import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess } from '../utils/response';
import * as reportService from '../services/reportService';
import { DateRangeQuery, MonthlyTrendQuery, TopMedicinesQuery } from '../validators/report.validators';

export const salesSummary = catchAsync(async (req: Request, res: Response) => {
  const data = await reportService.getSalesSummary(req.validated!.query as DateRangeQuery);
  sendSuccess(res, data);
});

export const profitAndLoss = catchAsync(async (req: Request, res: Response) => {
  const data = await reportService.getProfitAndLoss(req.validated!.query as DateRangeQuery);
  sendSuccess(res, data);
});

export const gst = catchAsync(async (req: Request, res: Response) => {
  const data = await reportService.getGstReport(req.validated!.query as DateRangeQuery);
  sendSuccess(res, data);
});

export const categoryDistribution = catchAsync(async (_req: Request, res: Response) => {
  const data = await reportService.getCategoryDistribution();
  sendSuccess(res, data);
});

export const monthlyTrend = catchAsync(async (req: Request, res: Response) => {
  const data = await reportService.getMonthlyTrend(req.validated!.query as MonthlyTrendQuery);
  sendSuccess(res, data);
});

export const topMedicines = catchAsync(async (req: Request, res: Response) => {
  const data = await reportService.getTopMedicines(req.validated!.query as TopMedicinesQuery);
  sendSuccess(res, data);
});
