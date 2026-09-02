import { Prescription } from '../types';

export const initialPrescriptions: Prescription[] = [
  {
    id: 'rx-2026-001',
    prescriptionNumber: 'RX-88901',
    customerId: 'cust-02',
    customerName: 'Rahul Varma',
    patientName: 'Rahul Varma',
    patientAge: 42,
    patientGender: 'Male',
    patientPhone: '9845012345',
    doctorName: 'Dr. S. K. Gupta MD',
    hospitalClinic: 'Apollo Multispecialty Clinic',
    doctorRegNumber: 'MCI-44912-KA',
    doctorRegistrationNumber: 'MCI-44912-KA',
    date: '2026-08-25',
    prescribedDate: '2026-08-25',
    expiryDate: '2026-11-25',
    diagnosis: 'Type 2 Diabetes Mellitus + Essential Stage-1 Hypertension',
    items: [
      {
        medicineId: 'med-04',
        medicineName: 'Glycomet-GP 2/500',
        dosage: '1-0-0 (Morning)',
        duration: '30 days',
        timing: 'Before Food',
        quantity: 2,
        instructions: 'Check fasting sugar weekly'
      },
      {
        medicineId: 'med-05',
        medicineName: 'Telma 40',
        dosage: '0-0-1 (Night)',
        duration: '30 days',
        timing: 'After Food',
        quantity: 1,
        instructions: 'Monitor blood pressure log'
      }
    ],
    medicines: [
      {
        medicineName: 'Glycomet-GP 2/500',
        genericName: 'Glimepiride (2mg) + Metformin (500mg PR)',
        dosage: '1-0-0 (Morning)',
        duration: '30 days',
        timing: 'Before Food',
        quantity: 2,
        notes: 'Check fasting sugar weekly'
      },
      {
        medicineName: 'Telma 40',
        genericName: 'Telmisartan (40mg)',
        dosage: '0-0-1 (Night)',
        duration: '30 days',
        timing: 'After Food',
        quantity: 1,
        notes: 'Monitor blood pressure log'
      }
    ],
    notes: 'Patient advised 45 min brisk walking daily and low carb diet.',
    attachmentUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&auto=format&fit=crop&q=80',
    status: 'Dispensed'
  },
  {
    id: 'rx-2026-002',
    prescriptionNumber: 'RX-88902',
    customerId: 'cust-04',
    customerName: 'Pooja Agarwal',
    patientName: 'Pooja Agarwal',
    patientAge: 35,
    patientGender: 'Female',
    patientPhone: '9934567812',
    doctorName: 'Dr. R. K. Iyer Pulmonologist',
    hospitalClinic: 'Fortis Chest & Allergy Center',
    doctorRegNumber: 'DMC-22819-DL',
    doctorRegistrationNumber: 'DMC-22819-DL',
    date: '2026-08-29',
    prescribedDate: '2026-08-29',
    expiryDate: '2026-11-29',
    diagnosis: 'Moderate Persistent Bronchial Asthma with Exercise-induced Wheeze',
    items: [
      {
        medicineId: 'med-07',
        medicineName: 'Seroflo 250 Synchrobreathe Inhaler',
        dosage: '1 puff Morning + 1 puff Night',
        duration: '60 days',
        timing: 'Before Food',
        quantity: 1,
        instructions: 'Rinse mouth thoroughly with water after inhalation'
      },
      {
        medicineId: 'med-02',
        medicineName: 'Montair-LC',
        dosage: '0-0-1 (Bedtime)',
        duration: '15 days',
        timing: 'Bedtime',
        quantity: 1,
        instructions: 'For seasonal flare protection'
      }
    ],
    medicines: [
      {
        medicineName: 'Seroflo 250 Synchrobreathe Inhaler',
        genericName: 'Salmeterol (25mcg) + Fluticasone (250mcg)',
        dosage: '1 puff Morning + 1 puff Night',
        duration: '60 days',
        timing: 'Before Food',
        quantity: 1,
        notes: 'Rinse mouth thoroughly with water after inhalation'
      },
      {
        medicineName: 'Montair-LC',
        genericName: 'Montelukast (10mg) + Levocetirizine (5mg)',
        dosage: '0-0-1 (Bedtime)',
        duration: '15 days',
        timing: 'Bedtime',
        quantity: 1,
        notes: 'For seasonal flare protection'
      }
    ],
    notes: 'Follow-up spirometry after 4 weeks.',
    attachmentUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=80',
    status: 'Pending'
  },
  {
    id: 'rx-2026-003',
    prescriptionNumber: 'RX-88903',
    customerId: 'cust-03',
    customerName: 'Ananya Deshmukh',
    patientName: 'Ananya Deshmukh',
    patientAge: 29,
    patientGender: 'Female',
    patientPhone: '9822098765',
    doctorName: 'Dr. Meera Sen ENT',
    hospitalClinic: 'Ruby Hall Clinic',
    doctorRegNumber: 'MMC-77312-MH',
    doctorRegistrationNumber: 'MMC-77312-MH',
    date: '2026-08-28',
    prescribedDate: '2026-08-28',
    expiryDate: '2026-11-28',
    diagnosis: 'Acute Allergic Rhino-sinusitis',
    items: [
      {
        medicineId: 'med-06',
        medicineName: 'Allegra 120mg',
        dosage: '1-0-0 (Morning)',
        duration: '10 days',
        timing: 'After Food',
        quantity: 1,
        instructions: 'Non-sedating antihistamine'
      },
      {
        medicineId: 'med-08',
        medicineName: 'Otrivin 0.1% Nasal Spray',
        dosage: '1 spray per nostril twice daily',
        duration: '5 days MAX',
        timing: 'After Food',
        quantity: 1,
        instructions: 'Do not use for more than 5 consecutive days to prevent rebound'
      }
    ],
    medicines: [
      {
        medicineName: 'Allegra 120mg',
        genericName: 'Fexofenadine HCl (120mg)',
        dosage: '1-0-0 (Morning)',
        duration: '10 days',
        timing: 'After Food',
        quantity: 1,
        notes: 'Non-sedating antihistamine'
      },
      {
        medicineName: 'Otrivin 0.1% Nasal Spray',
        genericName: 'Xylometazoline (0.1%)',
        dosage: '1 spray per nostril twice daily',
        duration: '5 days MAX',
        timing: 'After Food',
        quantity: 1,
        notes: 'Do not use for more than 5 consecutive days to prevent rebound'
      }
    ],
    notes: 'Steam inhalation twice daily recommended.',
    attachmentUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&auto=format&fit=crop&q=80',
    status: 'Dispensed'
  }
];
