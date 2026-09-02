import { z } from 'zod';

const storeSettingsSchema = z.object({
  name: z.string().trim().min(1),
  tagline: z.string().trim().optional(),
  address: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  pincode: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z.string().trim().optional(),
  gstin: z.string().trim().optional(),
  drugLicenseNumber20B: z.string().trim().optional(),
  drugLicenseNumber21B: z.string().trim().optional(),
  fssaiNumber: z.string().trim().optional()
});

const posSettingsSchema = z.object({
  defaultTaxRate: z.number().min(0).max(100),
  invoicePrefix: z.string().trim().min(1),
  thermalReceiptWidth: z.enum(['58mm', '80mm', 'A4']),
  autoPrintReceipt: z.boolean(),
  enableSoundEffects: z.boolean(),
  enableFEFOSuggestion: z.boolean(),
  allowNegativeStock: z.boolean(),
  requireDoctorNameForRx: z.boolean(),
  roundOffTotal: z.boolean()
});

const inventorySettingsSchema = z.object({
  lowStockThreshold: z.number().min(0),
  criticalStockThreshold: z.number().min(0),
  expiryWarningDays: z.number().min(0),
  criticalExpiryDays: z.number().min(0),
  enforceFEFO: z.boolean(),
  autoReorderAlerts: z.boolean()
});

export const updateSettingsSchema = z.object({
  body: z.object({
    store: storeSettingsSchema.partial().optional(),
    pos: posSettingsSchema.partial().optional(),
    inventory: inventorySettingsSchema.partial().optional()
  })
});

export type UpdateSettingsBody = z.infer<typeof updateSettingsSchema>['body'];
