import { Prescription, PrescriptionDoc } from '../models/Prescription.model';
import { AppError } from '../errors/AppError';
import { buildPagination, Pagination } from '../utils/response';
import { CreatePrescriptionBody, ListPrescriptionsQuery } from '../validators/prescription.validators';
import { PRESCRIPTION_STATUSES } from '../models/enums';

/**
 * prescriptionNumber sequencing: the old frontend used
 * `prescriptions.length + 88904` (collection-count-based, unsafe under
 * concurrency — same class of issue Sale.invoiceNumber had). Reuses the same
 * fix: an atomic Counter sequence (see models/Counter.model.ts), introduced
 * in Phase F for exactly this purpose.
 */
import { nextSequence } from '../models/Counter.model';
import mongoose from 'mongoose';

export async function listPrescriptions(
  query: ListPrescriptionsQuery
): Promise<{ items: PrescriptionDoc[]; pagination: Pagination }> {
  const filter: Record<string, unknown> = {};
  if (query.customerId) filter.customerId = query.customerId;
  if (query.status) filter.status = query.status;

  const skip = (query.page - 1) * query.limit;
  const [items, total] = await Promise.all([
    Prescription.find(filter).sort({ prescribedDate: -1 }).skip(skip).limit(query.limit),
    Prescription.countDocuments(filter)
  ]);
  return { items, pagination: buildPagination(query.page, query.limit, total) };
}

export async function getPrescriptionById(id: string): Promise<PrescriptionDoc> {
  const rx = await Prescription.findById(id);
  if (!rx) throw AppError.notFound('Prescription');
  return rx;
}

export async function createPrescription(body: CreatePrescriptionBody): Promise<PrescriptionDoc> {
  const session = await mongoose.startSession();
  try {
    let created!: PrescriptionDoc;
    await session.withTransaction(async () => {
      const seq = await nextSequence('prescription', session);
      const [rx] = await Prescription.create([{ ...body, prescriptionNumber: `RX-${seq}` }], { session });
      created = rx;
    });
    return created;
  } finally {
    await session.endSession();
  }
}

// No status-transition restriction here, matching the original frontend's
// prescriptionService.updateStatus() exactly — it sets whatever status is
// passed with no guard. Not adding one is deliberate: there's no documented
// business rule requiring it, and this phase preserves existing behavior
// rather than inventing new restrictions.
export async function updatePrescriptionStatus(
  id: string,
  status: (typeof PRESCRIPTION_STATUSES)[number]
): Promise<PrescriptionDoc> {
  const rx = await Prescription.findById(id);
  if (!rx) throw AppError.notFound('Prescription');
  rx.status = status;
  await rx.save();
  return rx;
}
