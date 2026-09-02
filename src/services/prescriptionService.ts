import { Prescription } from '../types';
import * as prescriptionsApi from '../api/prescriptions';
import { Pagination } from '../api/client';

/**
 * Phase K batch 3: backed by the real API. The legacy dual `items`/`medicines`
 * representation is gone — the backend has one canonical `items` shape (see
 * server/src/models/Prescription.model.ts), so the old normalizePrescription()
 * reconciliation is no longer needed. prescriptionNumber is now a real,
 * concurrency-safe Counter sequence (`RX-<n>`), not `prescriptions.length + 88904`.
 * No terminal-status rule is enforced (server matches this exactly) —
 * updateStatus() accepts any status transition, same as the original.
 */
class PrescriptionService {
  /** Capped at the backend's max page size (100) — see medicineService's identical, already-flagged limitation. */
  async getAll(): Promise<Prescription[]> {
    const { items } = await prescriptionsApi.listPrescriptions({ limit: 100 });
    return items;
  }

  async list(params: prescriptionsApi.ListPrescriptionsParams = {}): Promise<{ items: Prescription[]; pagination: Pagination }> {
    return prescriptionsApi.listPrescriptions(params);
  }

  async getById(id: string): Promise<Prescription | undefined> {
    try {
      return await prescriptionsApi.getPrescriptionById(id);
    } catch {
      return undefined;
    }
  }

  async create(input: prescriptionsApi.CreatePrescriptionRequest): Promise<Prescription> {
    return prescriptionsApi.createPrescription(input);
  }

  async updateStatus(id: string, status: Prescription['status']): Promise<Prescription> {
    return prescriptionsApi.updatePrescriptionStatus(id, status);
  }
}

export const prescriptionService = new PrescriptionService();
