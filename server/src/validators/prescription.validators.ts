import { z } from 'zod';
import { objectIdSchema } from './medicine.validators';
import { GENDERS, PRESCRIPTION_STATUSES, TIMINGS } from '../models/enums';

const prescriptionItemInputSchema = z.object({
  // Optional on purpose — a prescription frequently names a drug the pharmacy
  // hasn't catalogued yet (see Prescription.model.ts). Not existence-checked
  // against Medicine either, for the same reason.
  medicineId: objectIdSchema.optional(),
  medicineName: z.string().trim().min(1),
  dosage: z.string().trim().min(1),
  frequency: z.string().trim().optional(),
  duration: z.string().trim().min(1),
  quantity: z.number().int().min(1),
  instructions: z.string().trim().optional(),
  timing: z.enum(TIMINGS).optional()
});

const prescriptionBodyBase = z.object({
  customerId: objectIdSchema.optional(),
  patientName: z.string().trim().min(1),
  patientAge: z.number().int().min(0).max(130).optional(),
  patientGender: z.enum(GENDERS).optional(),
  patientPhone: z.string().trim().optional(),
  doctorName: z.string().trim().min(1),
  hospitalClinic: z.string().trim().optional(),
  doctorRegistrationNumber: z.string().trim().optional(),
  prescribedDate: z.coerce.date().default(() => new Date()),
  expiryDate: z.coerce.date().optional(),
  diagnosis: z.string().trim().optional(),
  items: z.array(prescriptionItemInputSchema).min(1, 'A prescription must contain at least one item'),
  refillsAllowed: z.number().int().min(0).optional(),
  notes: z.string().trim().optional(),
  attachmentUrl: z.string().trim().optional()
});

export const createPrescriptionSchema = z.object({ body: prescriptionBodyBase });
export const prescriptionIdParamSchema = z.object({ params: z.object({ id: objectIdSchema }) });

export const updatePrescriptionStatusSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z.object({ status: z.enum(PRESCRIPTION_STATUSES) })
});

export const listPrescriptionsQuerySchema = z.object({
  query: z.object({
    customerId: objectIdSchema.optional(),
    status: z.enum(PRESCRIPTION_STATUSES).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(25)
  })
});

export type CreatePrescriptionBody = z.infer<typeof createPrescriptionSchema>['body'];
export type ListPrescriptionsQuery = z.infer<typeof listPrescriptionsQuerySchema>['query'];
