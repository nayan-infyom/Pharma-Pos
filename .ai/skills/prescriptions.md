# .ai/skills/prescriptions.md — Prescriptions, Clinical Regimens & POS Dispensing

This skill guides AI assistants on prescription logging, clinical drug regimen mapping, and the 1-click POS dispensing pipeline.

---

## 1. Prescriptions Architecture

- **Page View**: `src/pages/PrescriptionsPage.tsx` (`/prescriptions`)
- **Service**: `src/services/prescriptionService.ts` (`prescriptionService`)
- **Related Types**: `Prescription`, `PrescriptionItem`, `CartItem`, `Customer`

---

## 2. Prescription Data Normalization

A prescription object contains:
- `prescriptionNumber` (e.g. `RX-88901`)
- `patientName`, `patientAge`, `patientGender`, `customerId`
- `doctorName`, `hospitalClinic`, `doctorRegistrationNumber` (e.g. `MCI-44912-KA`)
- `prescribedDate`, `expiryDate`, `diagnosis`
- `items`: Array of `PrescriptionItem`:
  - `medicineId`, `medicineName`, `dosage` (e.g. '1-0-1'), `duration` (e.g. '15 days'), `timing` ('Before Food' | 'After Food' | 'With Food' | 'Empty Stomach' | 'Bedtime'), `quantity`, `instructions`.
- `status`: `'Pending'` | `'Active'` | `'Dispensed'` | `'Partially Dispensed'` | `'Expired'`.

---

## 3. 1-Click "Dispense in POS" Pipeline

When a pharmacist clicks **"Dispense in POS"** on `/prescriptions`:
1. Navigates to `/pos`.
2. Locates the customer in `customerService` using `prescription.customerId` or `patientName`.
3. Calls `usePOSStore.getState().setCustomer(customer)`.
4. Sets prescribing doctor name: `usePOSStore.getState().setDoctorName(prescription.doctorName)`.
5. Clears active cart and iterates through `prescription.items`:
   - Matches `item.medicineId` against `medicineService.getById()`.
   - Adds the medicine to the POS cart using FEFO batch selection: `usePOSStore.getState().addItem(medicine, undefined, item.quantity)`.
6. Updates prescription status to `'Dispensed'`.
7. Shows toast notification: *"Prescription RX-XXXX transferred to POS cart with patient & doctor pre-filled."*

---

## 4. AI Invariants
- Always handle both legacy `medicines` array and modern `items` array gracefully via `normalizePrescription()` in `prescriptionService.ts`.
- Never attempt to dispense without verifying that `rx.items` is defined and contains at least one item.
