import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { sendPaginated, sendSuccess } from '../utils/response';
import * as prescriptionService from '../services/prescriptionService';
import { CreatePrescriptionBody, ListPrescriptionsQuery } from '../validators/prescription.validators';

export const list = catchAsync(async (req: Request, res: Response) => {
  const query = req.validated!.query as ListPrescriptionsQuery;
  const { items, pagination } = await prescriptionService.listPrescriptions(query);
  sendPaginated(res, items, pagination);
});

export const getById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.validated!.params as { id: string };
  const rx = await prescriptionService.getPrescriptionById(id);
  sendSuccess(res, rx);
});

export const create = catchAsync(async (req: Request, res: Response) => {
  const rx = await prescriptionService.createPrescription(req.body as CreatePrescriptionBody);
  sendSuccess(res, rx, 201);
});

export const updateStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.validated!.params as { id: string };
  const { status } = req.body as { status: 'Active' | 'Dispensed' | 'Partially Dispensed' | 'Expired' | 'Pending' };
  const rx = await prescriptionService.updatePrescriptionStatus(id, status);
  sendSuccess(res, rx);
});
