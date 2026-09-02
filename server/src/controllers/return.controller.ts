import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { sendPaginated, sendSuccess } from '../utils/response';
import * as returnService from '../services/returnService';
import { CreatePurchaseReturnBody, CreateSalesReturnBody, ListReturnsQuery } from '../validators/return.validators';

export const listCombined = catchAsync(async (req: Request, res: Response) => {
  const { page, limit } = req.validated!.query as ListReturnsQuery;
  const { items, pagination } = await returnService.listCombinedReturns(page, limit);
  sendPaginated(res, items, pagination);
});

export const createSalesReturn = catchAsync(async (req: Request, res: Response) => {
  const doc = await returnService.createSalesReturn(req.body as CreateSalesReturnBody, {
    employeeId: req.user!.employeeId,
    name: req.user!.name
  });
  sendSuccess(res, doc, 201);
});

export const listSalesReturns = catchAsync(async (req: Request, res: Response) => {
  const { page, limit } = req.validated!.query as ListReturnsQuery;
  const { items, pagination } = await returnService.listSalesReturns(page, limit);
  sendPaginated(res, items, pagination);
});

export const getSalesReturnById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.validated!.params as { id: string };
  const doc = await returnService.getSalesReturnById(id);
  sendSuccess(res, doc);
});

export const createPurchaseReturn = catchAsync(async (req: Request, res: Response) => {
  const doc = await returnService.createPurchaseReturn(req.body as CreatePurchaseReturnBody, {
    employeeId: req.user!.employeeId,
    name: req.user!.name
  });
  sendSuccess(res, doc, 201);
});

export const listPurchaseReturns = catchAsync(async (req: Request, res: Response) => {
  const { page, limit } = req.validated!.query as ListReturnsQuery;
  const { items, pagination } = await returnService.listPurchaseReturns(page, limit);
  sendPaginated(res, items, pagination);
});

export const getPurchaseReturnById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.validated!.params as { id: string };
  const doc = await returnService.getPurchaseReturnById(id);
  sendSuccess(res, doc);
});
