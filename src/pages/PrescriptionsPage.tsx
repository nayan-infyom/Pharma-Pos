import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { prescriptionService } from '../services/prescriptionService';
import { customerService } from '../services/customerService';
import { medicineService } from '../services/medicineService';
import { Prescription, Customer, Medicine, PrescriptionItem } from '../types';
import { ApiError, Pagination as PaginationMeta } from '../api/client';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Drawer } from '../components/ui/Drawer';
import { Pagination } from '../components/ui/Pagination';
import {
  Search,
  Plus,
  FileText,
  ShoppingCart,
  Trash2,
  Loader2
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { usePOSStore } from '../store/usePOSStore';
import { formatDate } from '../utils/formatters';

const PAGE_SIZE = 20;

export const PrescriptionsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useAppStore();
  const { setCustomer, setDoctorName, addItem, clearCart } = usePOSStore();

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Prescription['status'] | 'All'>('All');
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null);
  const [isNewRxOpen, setIsNewRxOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDispensing, setIsDispensing] = useState(false);

  // New Rx form state
  const [rxPatientId, setRxPatientId] = useState('');
  const [rxDoctorName, setRxDoctorName] = useState('Dr. Sarah Jenkins, MD');
  const [rxDoctorReg, setRxDoctorReg] = useState('REG-MD-9921');
  const [rxHospital, setRxHospital] = useState('Galleria Specialty Clinic');
  const [rxDiagnosis, setRxDiagnosis] = useState('');
  const [rxExpiryDate, setRxExpiryDate] = useState('');
  const [rxNotes, setRxNotes] = useState('');
  const [rxItems, setRxItems] = useState<PrescriptionItem[]>([]);

  // Item row state
  const [itemMedId, setItemMedId] = useState('');
  const [itemDosage, setItemDosage] = useState('1 Tablet twice daily after meals');
  const [itemDuration, setItemDuration] = useState('5 Days');
  const [itemQty, setItemQty] = useState('10');
  const [itemInstructions, setItemInstructions] = useState('Complete full antibiotic course');

  useEffect(() => {
    Promise.all([customerService.getAll(), medicineService.getAll()]).then(([custList, medList]) => {
      setCustomers(custList);
      setMedicines(medList);
      if (custList.length > 0) setRxPatientId(custList[0].id);
      if (medList.length > 0) setItemMedId(medList[0].id);
    });
    if (searchParams.get('action') === 'new') {
      setIsNewRxOpen(true);
      setSearchParams({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadPrescriptions(page, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  const loadPrescriptions = async (targetPage: number, status: Prescription['status'] | 'All') => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const { items, pagination: p } = await prescriptionService.list({
        status: status === 'All' ? undefined : status,
        page: targetPage,
        limit: PAGE_SIZE
      });
      setPrescriptions(items);
      setPagination(p);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Failed to load prescriptions.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRxItem = () => {
    const med = medicines.find(m => m.id === itemMedId);
    if (!med) return;

    const newItem: PrescriptionItem = {
      medicineId: med.id,
      medicineName: med.name,
      dosage: itemDosage,
      frequency: 'BID',
      duration: itemDuration,
      quantity: parseInt(itemQty) || 10,
      instructions: itemInstructions
    };

    setRxItems([...rxItems, newItem]);
    addToast({
      type: 'info',
      title: 'Item Added',
      message: `${med.name} added to prescription.`
    });
  };

  const handleRemoveRxItem = (idx: number) => {
    setRxItems(rxItems.filter((_, i) => i !== idx));
  };

  const handleCreatePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreating) return;
    if (rxItems.length === 0) {
      addToast({
        type: 'error',
        title: 'Empty Prescription',
        message: 'Please add at least one prescribed drug item.'
      });
      return;
    }

    const patient = customers.find(c => c.id === rxPatientId);
    if (!patient) return;

    setIsCreating(true);
    try {
      const created = await prescriptionService.create({
        customerId: patient.id,
        patientName: patient.name,
        patientPhone: patient.phone,
        doctorName: rxDoctorName.trim(),
        doctorRegistrationNumber: rxDoctorReg.trim() || undefined,
        hospitalClinic: rxHospital.trim() || undefined,
        diagnosis: rxDiagnosis.trim() || undefined,
        expiryDate: rxExpiryDate || undefined,
        items: rxItems,
        refillsAllowed: 2,
        notes: rxNotes || undefined
      });

      addToast({
        type: 'success',
        title: 'Prescription Saved',
        message: `${created.prescriptionNumber} registered for ${patient.name}.`
      });

      setIsNewRxOpen(false);
      setRxItems([]);
      setRxDiagnosis('');
      setRxExpiryDate('');
      setRxNotes('');
      setPage(1);
      loadPrescriptions(1, statusFilter);
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Could Not Save Prescription',
        message: err instanceof ApiError ? err.message : 'Failed to create prescription.'
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDispenseInPOS = async (rx: Prescription) => {
    if (isDispensing) return;
    setIsDispensing(true);
    try {
      const patient = customers.find(c => c.id === rx.customerId);
      clearCart();
      if (patient) {
        setCustomer(patient);
      }
      if (rx.doctorName) {
        setDoctorName(rx.doctorName);
      }

      for (const item of rx.items || []) {
        const med = medicines.find(m => m.id === item.medicineId || (m.name && item.medicineName && m.name.toLowerCase() === item.medicineName.toLowerCase()));
        if (med) {
          addItem(med, undefined, item.quantity);
        }
      }

      // No terminal-status rule server-side, matching the original frontend
      // behavior exactly — this always sets 'Dispensed' with no guard.
      await prescriptionService.updateStatus(rx.id, 'Dispensed');

      addToast({
        type: 'success',
        title: 'Rx Loaded in POS',
        message: `Prescribed drugs loaded into POS terminal for ${rx.customerName || rx.patientName}.`
      });

      navigate('/pos');
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Could Not Dispense',
        message: err instanceof ApiError ? err.message : 'Failed to update prescription status.'
      });
    } finally {
      setIsDispensing(false);
    }
  };

  // Free-text search has no backend index for this endpoint (only
  // customerId/status are server-filterable) — refined client-side over the
  // current loaded page, same documented pattern as other capped list reads.
  const filteredPrescriptions = prescriptions.filter(rx => {
    const q = (searchQuery || '').toLowerCase().trim();
    if (!q) return true;
    return (
      (rx.customerName || rx.patientName || '').toLowerCase().includes(q) ||
      (rx.doctorName || '').toLowerCase().includes(q) ||
      rx.prescriptionNumber.toLowerCase().includes(q) ||
      (rx.diagnosis && rx.diagnosis.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Prescription Dispenser (Rx)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit physician scripts, verify drug dosage safety and 1-click dispense into POS terminal
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          onClick={() => setIsNewRxOpen(true)}
        >
          Register Prescription
        </Button>
      </div>

      {/* Overview Stat Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Prescriptions Logged</span>
          <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
            {pagination?.total ?? prescriptions.length} Records
          </div>
          <span className="text-[11px] text-slate-400">Total doctor prescriptions</span>
        </div>

        <div className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Pending Dispense (this page)</span>
          <div className="text-lg font-bold font-mono text-amber-700 mt-0.5">
            {prescriptions.filter(p => p.status === 'Pending').length} Pending
          </div>
          <span className="text-[11px] text-slate-400">Awaiting cashier fulfillment</span>
        </div>

        <div className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Dispensed (this page)</span>
          <div className="text-lg font-bold font-mono text-emerald-700 mt-0.5">
            {prescriptions.filter(p => p.status === 'Dispensed').length} Fulfilled
          </div>
          <span className="text-[11px] text-slate-400">Pharmacist certified</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-3 rounded-xl border border-slate-200 bg-white shadow-2xs flex flex-col sm:flex-row gap-2.5">
        <div className="flex-1">
          <Input
            placeholder="Search patient name, doctor, diagnosis, Rx # (current page)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            className="text-xs"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as Prescription['status'] | 'All'); setPage(1); }}
          className="h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700"
        >
          <option value="All">All Dispensing Statuses</option>
          <option value="Pending">Pending Dispensing</option>
          <option value="Active">Active</option>
          <option value="Dispensed">Dispensed (Fulfilled)</option>
          <option value="Partially Dispensed">Partially Dispensed</option>
          <option value="Expired">Expired</option>
        </select>
      </div>

      {/* Prescriptions Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
        {loadError ? (
          <div className="p-6 text-center text-xs text-rose-600">
            {loadError}{' '}
            <button className="underline font-semibold" onClick={() => loadPrescriptions(page, statusFilter)}>Retry</button>
          </div>
        ) : isLoading ? (
          <div className="p-10 flex items-center justify-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin" /></div>
        ) : filteredPrescriptions.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-400">No prescriptions match your search.</div>
        ) : (
        <>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3.5 font-semibold">Rx #</th>
                <th className="py-2.5 px-3.5 font-semibold">Patient Name</th>
                <th className="py-2.5 px-3.5 font-semibold">Prescribing Physician</th>
                <th className="py-2.5 px-3.5 font-semibold">Date</th>
                <th className="py-2.5 px-3.5 font-semibold">Status</th>
                <th className="py-2.5 px-3.5 font-semibold text-right">Items</th>
                <th className="py-2.5 px-3.5 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPrescriptions.map((rx) => (
                <tr key={rx.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3.5 font-mono font-semibold text-slate-900">
                    {rx.prescriptionNumber}
                  </td>
                  <td className="py-2.5 px-3.5">
                    <div className="font-semibold text-slate-900">{rx.customerName || rx.patientName}</div>
                    <div className="text-[10px] text-slate-400">{rx.diagnosis || 'Clinical Rx'}</div>
                  </td>
                  <td className="py-2.5 px-3.5">
                    <div className="font-medium text-slate-900">{rx.doctorName}</div>
                    <div className="text-[10px] text-slate-400">{rx.hospitalClinic}</div>
                  </td>
                  <td className="py-2.5 px-3.5 font-mono text-slate-500">{formatDate(rx.prescribedDate)}</td>
                  <td className="py-2.5 px-3.5">
                    <Badge variant={rx.status === 'Dispensed' ? 'success' : rx.status === 'Expired' ? 'danger' : 'warning'} size="sm">
                      {rx.status}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-mono font-semibold">
                    {(rx.items?.length || 0)} meds
                  </td>
                  <td className="py-2.5 px-3.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="xs"
                        leftIcon={<FileText className="w-3.5 h-3.5" />}
                        onClick={() => setSelectedRx(rx)}
                      >
                        Inspect
                      </Button>

                      <Button
                        variant="primary"
                        size="xs"
                        leftIcon={<ShoppingCart className="w-3.5 h-3.5" />}
                        isLoading={isDispensing}
                        onClick={() => handleDispenseInPOS(rx)}
                      >
                        Dispense
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pagination && <Pagination pagination={pagination} onPageChange={setPage} itemLabel="prescriptions" />}
        </>
        )}
      </div>

      {/* Inspect Prescription Drawer */}
      {selectedRx && (
        <Drawer
          isOpen={!!selectedRx}
          onClose={() => setSelectedRx(null)}
          title={`Prescription ${selectedRx.prescriptionNumber}`}
          description={`Patient: ${selectedRx.customerName || selectedRx.patientName} • Date: ${formatDate(selectedRx.prescribedDate)}`}
          width="lg"
        >
          <div className="space-y-3.5 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <div className="flex justify-between">
                <div>
                  <span className="text-slate-500">Doctor:</span>
                  <p className="font-semibold text-slate-900">{selectedRx.doctorName}</p>
                  <p className="text-[10px] text-slate-500 font-mono">Reg: {selectedRx.doctorRegistrationNumber || 'N/A'}</p>
                </div>
                <div className="text-right">
                  <span className="text-slate-500">Clinic / Hospital:</span>
                  <p className="font-semibold text-slate-900">{selectedRx.hospitalClinic || 'N/A'}</p>
                </div>
              </div>
              <div className="border-t border-slate-200 pt-2 text-[11px] text-slate-500">
                <span>Clinical Diagnosis: </span>
                <span className="font-semibold text-slate-800">{selectedRx.diagnosis || 'Not specified'}</span>
              </div>
              {selectedRx.expiryDate && (
                <div className="text-[11px] text-slate-500">
                  <span>Prescription Expiry: </span>
                  <span className="font-semibold text-slate-800">{formatDate(selectedRx.expiryDate)}</span>
                </div>
              )}
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-2">
                Prescribed Drug Regimen ({selectedRx.items?.length || 0} items)
              </h4>
              <div className="space-y-2">
                {(selectedRx.items || []).map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg border border-slate-200 bg-white space-y-1"
                  >
                    <div className="flex justify-between font-semibold text-slate-900">
                      <span>{item.medicineName}</span>
                      <span className="font-mono text-teal-700">{item.quantity} Units</span>
                    </div>
                    <p className="text-slate-600">
                      Dosage: {item.dosage} • Duration: {item.duration}
                    </p>
                    {item.instructions && (
                      <p className="text-[10px] text-slate-400 italic">
                        Note: {item.instructions}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-between">
              <Button variant="outline" size="sm" onClick={() => setSelectedRx(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<ShoppingCart className="w-3.5 h-3.5" />}
                isLoading={isDispensing}
                onClick={() => handleDispenseInPOS(selectedRx)}
              >
                1-Click Dispense in POS
              </Button>
            </div>
          </div>
        </Drawer>
      )}

      {/* New Prescription Modal */}
      <Modal
        isOpen={isNewRxOpen}
        onClose={() => setIsNewRxOpen(false)}
        title="Register Medical Prescription"
        description="Record physician script with dosage regimen for dispensing"
        maxWidth="3xl"
      >
        <form onSubmit={handleCreatePrescription} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Patient</label>
              <select
                value={rxPatientId}
                onChange={(e) => setRxPatientId(e.target.value)}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700"
                required
              >
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                ))}
              </select>
            </div>

            <Input
              label="Prescribing Physician"
              placeholder="e.g. Dr. Sarah Jenkins, MD"
              value={rxDoctorName}
              onChange={(e) => setRxDoctorName(e.target.value)}
              required
            />

            <Input
              label="Clinic / Hospital Name"
              placeholder="e.g. Galleria Specialty Clinic"
              value={rxHospital}
              onChange={(e) => setRxHospital(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <Input
              label="Diagnosis / Medical Assessment"
              placeholder="e.g. Upper Respiratory Tract Infection (URTI)"
              value={rxDiagnosis}
              onChange={(e) => setRxDiagnosis(e.target.value)}
            />

            <Input
              label="Prescription Expiry (Optional)"
              type="date"
              value={rxExpiryDate}
              onChange={(e) => setRxExpiryDate(e.target.value)}
            />
          </div>

          {/* Add Regimen Item Bar */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2.5">
            <h4 className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-emerald-600" /> Prescribe Drug Item
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="col-span-2">
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Drug Formulation</label>
                <select
                  value={itemMedId}
                  onChange={(e) => setItemMedId(e.target.value)}
                  className="w-full h-8 px-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-700"
                >
                  {medicines.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.strength})</option>
                  ))}
                </select>
              </div>

              <Input
                label="Dosage Instructions"
                placeholder="e.g. 1 Tab BID after food"
                value={itemDosage}
                onChange={(e) => setItemDosage(e.target.value)}
                className="h-8 text-xs"
              />

              <Input
                label="Course Duration"
                placeholder="e.g. 5 Days"
                value={itemDuration}
                onChange={(e) => setItemDuration(e.target.value)}
                className="h-8 text-xs"
              />

              <Input
                label="Dispense Quantity"
                type="number"
                value={itemQty}
                onChange={(e) => setItemQty(e.target.value)}
                className="h-8 text-xs font-mono"
              />

              <div className="col-span-3">
                <Input
                  label="Special Patient Directions"
                  placeholder="e.g. Avoid dairy within 2 hours of administration"
                  value={itemInstructions}
                  onChange={(e) => setItemInstructions(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Button
                type="button"
                variant="secondary"
                size="xs"
                onClick={handleAddRxItem}
              >
                + Add Regimen Row
              </Button>
            </div>
          </div>

          {/* Items Preview */}
          {rxItems.length > 0 && (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 font-semibold text-slate-600">
                  <tr>
                    <th className="py-2 px-3">Medicine</th>
                    <th className="py-2 px-3">Dosage & Frequency</th>
                    <th className="py-2 px-3">Duration</th>
                    <th className="py-2 px-3 text-right">Qty</th>
                    <th className="py-2 px-3 text-center">Del</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rxItems.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-3 font-semibold">{item.medicineName}</td>
                      <td className="py-2 px-3">{item.dosage}</td>
                      <td className="py-2 px-3">{item.duration}</td>
                      <td className="py-2 px-3 text-right font-bold">{item.quantity}</td>
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveRxItem(idx)}
                          className="p-1 text-rose-600 hover:text-rose-800 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsNewRxOpen(false)} disabled={isCreating}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isCreating}>
              Save Prescription
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
