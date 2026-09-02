import { apiGet, apiGetPaginated, apiPatch, apiPost, Pagination } from './client';
import { Prescription, PrescriptionItem } from '../types';

export interface CreatePrescriptionRequest {
  customerId?: string;
  patientName: string;
  patientAge?: number;
  patientGender?: 'Male' | 'Female' | 'Other';
  patientPhone?: string;
  doctorName: string;
  hospitalClinic?: string;
  doctorRegistrationNumber?: string;
  prescribedDate?: string;
  expiryDate?: string;
  diagnosis?: string;
  items: PrescriptionItem[];
  refillsAllowed?: number;
  notes?: string;
  attachmentUrl?: string;
}

export interface ListPrescriptionsParams {
  customerId?: string;
  status?: Prescription['status'];
  page?: number;
  limit?: number;
}

export async function listPrescriptions(params: ListPrescriptionsParams = {}): Promise<{ items: Prescription[]; pagination: Pagination }> {
  return apiGetPaginated<Prescription>('/prescriptions', { ...params });
}
export async function getPrescriptionById(id: string): Promise<Prescription> {
  return apiGet<Prescription>(`/prescriptions/${id}`);
}
export async function createPrescription(body: CreatePrescriptionRequest): Promise<Prescription> {
  return apiPost<Prescription>('/prescriptions', body);
}
export async function updatePrescriptionStatus(id: string, status: Prescription['status']): Promise<Prescription> {
  return apiPatch<Prescription>(`/prescriptions/${id}/status`, { status });
}
