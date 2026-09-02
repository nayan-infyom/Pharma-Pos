import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess } from '../utils/response';
import * as settingsService from '../services/settingsService';
import { UpdateSettingsBody } from '../validators/settings.validators';

export const get = catchAsync(async (_req: Request, res: Response) => {
  const settings = await settingsService.getSettings();
  sendSuccess(res, settings);
});

export const update = catchAsync(async (req: Request, res: Response) => {
  const settings = await settingsService.updateSettings(req.body as UpdateSettingsBody);
  sendSuccess(res, settings);
});
