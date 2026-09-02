import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/requirePermission';
import { validate } from '../middleware/validate';
import * as controller from '../controllers/settings.controller';
import { updateSettingsSchema } from '../validators/settings.validators';

// manage_settings is an exact existing-permission fit — held by Admin only
// per seed data. Reads are gated behind it too (not opened to every role):
// the sidebar never actually permission-filtered its nav links (Settings
// was visible to everyone, cosmetic-only per the original audit), so this
// is the first real enforcement of that boundary, not a narrowing of one.
export const settingsRouter = Router();

settingsRouter.use(requireAuth);
settingsRouter.use(requirePermission('manage_settings'));

settingsRouter.get('/', controller.get);
settingsRouter.patch('/', validate(updateSettingsSchema), controller.update);
