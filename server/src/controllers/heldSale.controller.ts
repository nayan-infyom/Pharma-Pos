import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { sendPaginated, sendSuccess } from '../utils/response';
import * as heldSaleService from '../services/heldSaleService';
import { CreateHeldSaleBody, ListHeldSalesQuery } from '../validators/heldSale.validators';

export const hold = catchAsync(async (req: Request, res: Response) => {
  const heldSale = await heldSaleService.holdSale(req.body as CreateHeldSaleBody, { employeeId: req.user!.employeeId });
  sendSuccess(res, heldSale, 201);
});

export const list = catchAsync(async (req: Request, res: Response) => {
  const query = req.validated!.query as ListHeldSalesQuery;
  const { items, pagination } = await heldSaleService.listHeldSales({ employeeId: req.user!.employeeId }, query);
  sendPaginated(res, items, pagination);
});

export const getById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.validated!.params as { id: string };
  const heldSale = await heldSaleService.getHeldSaleById(id, { employeeId: req.user!.employeeId });
  sendSuccess(res, heldSale);
});

export const remove = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.validated!.params as { id: string };
  await heldSaleService.deleteHeldSale(id, { employeeId: req.user!.employeeId });
  sendSuccess(res, { deleted: true });
});
