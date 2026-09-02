import { Prescription, PrescriptionItem } from '../types';
import { initialPrescriptions } from '../data/prescriptions';

const STORAGE_KEY = 'pharmapos_prescriptions_v1';

class PrescriptionService {
  private prescriptions: Prescription[];

  constructor() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed: Prescription[] = JSON.parse(saved);
        this.prescriptions = parsed.map(p => this.normalizePrescription(p));
      } catch (e) {
        this.prescriptions = initialPrescriptions.map(p => this.normalizePrescription(p));
      }
    } else {
      this.prescriptions = initialPrescriptions.map(p => this.normalizePrescription(p));
      this.persist();
    }
  }

  private normalizePrescription(p: Prescription): Prescription {
    const normalizedItems: PrescriptionItem[] = p.items && p.items.length > 0 
      ? p.items 
      : (p.medicines || []).map((m, idx) => ({
          medicineId: `med-mapped-${idx}`,
          medicineName: m.medicineName,
          dosage: m.dosage,
          duration: m.duration,
          quantity: m.quantity || 1,
          timing: m.timing,
          instructions: m.notes
        }));

    return {
      ...p,
      customerName: p.customerName || p.patientName || 'Patient',
      patientName: p.patientName || p.customerName || 'Patient',
      doctorRegistrationNumber: p.doctorRegistrationNumber || p.doctorRegNumber || 'REG-DOC-001',
      prescribedDate: p.prescribedDate || p.date || new Date().toISOString().split('T')[0],
      items: normalizedItems,
      medicines: p.medicines || normalizedItems.map(item => ({
        medicineName: item.medicineName,
        dosage: item.dosage,
        duration: item.duration,
        timing: item.timing || 'After Food',
        quantity: item.quantity,
        notes: item.instructions
      }))
    };
  }

  private persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.prescriptions));
  }

  async getAll(): Promise<Prescription[]> {
    return [...this.prescriptions];
  }

  async getById(id: string): Promise<Prescription | undefined> {
    return this.prescriptions.find(p => p.id === id);
  }

  async create(prescriptionData: Omit<Prescription, 'id' | 'prescriptionNumber'>): Promise<Prescription> {
    const count = this.prescriptions.length + 88904;
    const newRx: Prescription = {
      ...prescriptionData,
      id: `rx-${Date.now()}`,
      prescriptionNumber: `RX-${count}`
    };
    this.prescriptions.unshift(newRx);
    this.persist();
    return newRx;
  }

  async updateStatus(id: string, status: Prescription['status']): Promise<Prescription> {
    const rx = this.prescriptions.find(p => p.id === id);
    if (!rx) throw new Error('Prescription not found');
    rx.status = status;
    this.persist();
    return rx;
  }
}

export const prescriptionService = new PrescriptionService();
