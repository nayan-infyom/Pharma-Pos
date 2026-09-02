import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { medicineService } from '../services/medicineService';
import { Medicine } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Drawer } from '../components/ui/Drawer';
import { 
  Search, 
  Plus, 
  Eye, 
  ShoppingCart
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { usePOSStore } from '../store/usePOSStore';
import { formatINR } from '../utils/formatters';

export const MedicinesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useAppStore();
  const { addItem } = usePOSStore();

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [formFilter, setFormFilter] = useState('All');
  const [rxFilter, setRxFilter] = useState('All');

  // New medicine modal
  const [isNewMedOpen, setIsNewMedOpen] = useState(false);
  const [selectedMed, setSelectedMed] = useState<Medicine | null>(null);

  // New med form state
  const [medName, setMedName] = useState('');
  const [medGeneric, setMedGeneric] = useState('');
  const [medBrand, setMedBrand] = useState('');
  const [medCategory, setMedCategory] = useState('Antibiotics');
  const [medForm, setMedForm] = useState('Tablet');
  const [medStrength, setMedStrength] = useState('500mg');
  const [medPackSize, setMedPackSize] = useState('10 Tablets / Strip');
  const [medBarcode, setMedBarcode] = useState('');
  const [medRack, setMedRack] = useState('A-01');
  const [medPurchasePrice, setMedPurchasePrice] = useState('120.00');
  const [medMrp, setMedMrp] = useState('190.00');
  const [medSellingPrice, setMedSellingPrice] = useState('175.00');
  const [medGstRate, setMedGstRate] = useState('12');
  const [medReorder, setMedReorder] = useState('20');
  const [medRxReq, setMedRxReq] = useState(false);
  const [medScheduleH, setMedScheduleH] = useState(false);

  // Initial batch fields
  const [initBatchNo, setInitBatchNo] = useState('BAT-2026-01');
  const [initBatchQty, setInitBatchQty] = useState('100');
  const [initBatchExp, setInitBatchExp] = useState('2028-06-30');

  useEffect(() => {
    loadMedicines();
    if (searchParams.get('action') === 'new') {
      setIsNewMedOpen(true);
      setSearchParams({});
    }
  }, []);

  const loadMedicines = async () => {
    const list = await medicineService.getAll();
    setMedicines(list);
  };

  const handleCreateMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medName.trim() || !medGeneric.trim()) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Medicine brand name and generic formula are required.'
      });
      return;
    }

    const pPrice = parseFloat(medPurchasePrice) || 0;
    const mrp = parseFloat(medMrp) || 0;
    const sPrice = parseFloat(medSellingPrice) || 0;
    const initQty = parseInt(initBatchQty) || 0;

    const newMed = await medicineService.create({
      name: medName.trim(),
      genericName: medGeneric.trim(),
      brand: medBrand.trim() || medName.trim(),
      category: medCategory,
      dosageForm: medForm,
      strength: medStrength.trim(),
      packSize: medPackSize.trim(),
      barcode: medBarcode.trim() || `890${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      rackLocation: medRack.trim(),
      prescriptionRequired: medRxReq,
      isScheduleH: medScheduleH,
      purchasePrice: pPrice,
      mrp: mrp,
      sellingPrice: sPrice,
      gstRate: parseFloat(medGstRate) || 12,
      reorderLevel: parseInt(medReorder) || 20,
      batches: [
        {
          id: `batch-${Date.now()}`,
          medicineId: `med-${Date.now()}`,
          batchNumber: initBatchNo.toUpperCase().trim() || 'AUG26-01',
          supplierId: 'sup-01',
          supplierName: 'Apex Wholesale Pharma Corp',
          quantity: initQty,
          purchasePrice: pPrice,
          mrp: mrp,
          sellingPrice: sPrice,
          mfgDate: '2026-01-01',
          expiryDate: initBatchExp,
          status: 'Active',
          rackLocation: medRack.trim()
        }
      ]
    });

    addToast({
      type: 'success',
      title: 'Medicine Added',
      message: `${newMed.name} registered and ready for POS sales.`
    });

    setIsNewMedOpen(false);
    resetForm();
    loadMedicines();
  };

  const resetForm = () => {
    setMedName('');
    setMedGeneric('');
    setMedBrand('');
    setMedBarcode('');
  };

  const filteredMedicines = medicines.filter(m => {
    const q = (searchQuery || '').toLowerCase().trim();
    const matchesSearch =
      !q ||
      (m.name || '').toLowerCase().includes(q) ||
      (m.genericName || '').toLowerCase().includes(q) ||
      (m.brand || '').toLowerCase().includes(q) ||
      (m.sku || '').toLowerCase().includes(q) ||
      (m.barcode || '').includes(q);

    const matchesCat = categoryFilter === 'All' || m.category === categoryFilter;
    const matchesForm = formFilter === 'All' || m.dosageForm === formFilter;
    const matchesRx = rxFilter === 'All' || (rxFilter === 'Rx Only' ? m.prescriptionRequired : !m.prescriptionRequired);

    return matchesSearch && matchesCat && matchesForm && matchesRx;
  });

  const categories = ['All', 'Antibiotics', 'Analgesics', 'Gastrointestinal', 'Cardiovascular', 'Antidiabetic', 'Respiratory', 'Dermatology'];
  const dosageForms = ['All', 'Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Drops'];

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Medicines Master Catalog
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Central pharmaceutical drug database, formulations, barcodes and rack storage
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          onClick={() => setIsNewMedOpen(true)}
        >
          Add Medicine Master
        </Button>
      </div>

      {/* Filter Toolbar */}
      <div className="p-3 rounded-xl border border-slate-200 bg-white shadow-2xs flex flex-col md:flex-row gap-2.5">
        <div className="flex-1">
          <Input
            placeholder="Search drug name, generic molecule formula, barcode, SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            className="text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 px-2.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-900"
          >
            {categories.map(c => (
              <option key={c} value={c}>{c === 'All' ? 'All Classes' : c}</option>
            ))}
          </select>

          <select
            value={formFilter}
            onChange={(e) => setFormFilter(e.target.value)}
            className="h-9 px-2.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-900"
          >
            {dosageForms.map(f => (
              <option key={f} value={f}>{f === 'All' ? 'All Forms' : f}</option>
            ))}
          </select>

          <select
            value={rxFilter}
            onChange={(e) => setRxFilter(e.target.value)}
            className="h-9 px-2.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-900"
          >
            <option value="All">All Rx Types</option>
            <option value="Rx Only">Prescription (Rx) Only</option>
            <option value="OTC">Over-the-Counter (OTC)</option>
          </select>
        </div>
      </div>

      {/* Master Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3.5 font-semibold">Medicine Brand</th>
                <th className="py-2.5 px-3.5 font-semibold">Generic Molecule</th>
                <th className="py-2.5 px-3.5 font-semibold">Form & Strength</th>
                <th className="py-2.5 px-3.5 font-semibold">Rack</th>
                <th className="py-2.5 px-3.5 font-semibold text-right">Selling Price</th>
                <th className="py-2.5 px-3.5 font-semibold text-right">MRP</th>
                <th className="py-2.5 px-3.5 font-semibold text-right">Stock</th>
                <th className="py-2.5 px-3.5 font-semibold text-center">Flags</th>
                <th className="py-2.5 px-3.5 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMedicines.map((med) => (
                <tr key={med.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3.5">
                    <div className="font-semibold text-slate-900">{med.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{med.sku}</div>
                  </td>
                  <td className="py-2.5 px-3.5 text-slate-600">
                    {med.genericName}
                  </td>
                  <td className="py-2.5 px-3.5">
                    <span className="font-medium text-slate-700">
                      {med.dosageForm} • {med.strength}
                    </span>
                    <div className="text-[10px] text-slate-400">{med.packSize}</div>
                  </td>
                  <td className="py-2.5 px-3.5 font-mono text-slate-500">
                    {med.rackLocation || 'A-01'}
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-mono font-bold text-slate-900">
                    {formatINR(med.sellingPrice)}
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-mono text-slate-400">
                    {formatINR(med.mrp)}
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-mono font-bold">
                    <span className={med.totalStock === 0 ? 'text-rose-600' : med.totalStock <= med.reorderLevel ? 'text-amber-600' : 'text-emerald-700'}>
                      {med.totalStock}
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {med.prescriptionRequired && <Badge variant="rx" size="sm">Rx</Badge>}
                      {med.isScheduleH && <Badge variant="danger" size="sm">Sch H</Badge>}
                    </div>
                  </td>
                  <td className="py-2.5 px-3.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="xs"
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                        onClick={() => setSelectedMed(med)}
                      >
                        Inspect
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        leftIcon={<ShoppingCart className="w-3.5 h-3.5 text-emerald-700" />}
                        onClick={() => {
                          addItem(med);
                          addToast({
                            type: 'success',
                            title: 'Added to POS Cart',
                            message: `${med.name} added to cashier cart.`
                          });
                          navigate('/pos');
                        }}
                      >
                        POS
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Medicine Drawer */}
      {selectedMed && (
        <Drawer
          isOpen={!!selectedMed}
          onClose={() => setSelectedMed(null)}
          title={selectedMed.name}
          description={`${selectedMed.genericName} • SKU: ${selectedMed.sku}`}
          width="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl text-xs border border-slate-200">
              <div>
                <span className="text-slate-500">Therapeutic Class:</span>
                <p className="font-semibold text-slate-900">{selectedMed.category}</p>
              </div>
              <div>
                <span className="text-slate-500">Dosage & Strength:</span>
                <p className="font-semibold text-slate-900">{selectedMed.dosageForm} ({selectedMed.strength})</p>
              </div>
              <div>
                <span className="text-slate-500">Rack Location:</span>
                <p className="font-mono font-semibold text-slate-900">{selectedMed.rackLocation || 'A-01'}</p>
              </div>
              <div>
                <span className="text-slate-500">Barcode:</span>
                <p className="font-mono text-slate-900">{selectedMed.barcode || 'N/A'}</p>
              </div>
            </div>

            {/* Live Batches List */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 mb-2">
                Active Batches ({selectedMed.batches.length})
              </h4>
              <div className="space-y-2">
                {selectedMed.batches.map((batch) => (
                  <div
                    key={batch.id}
                    className="p-3 rounded-lg border border-slate-200 bg-white text-xs space-y-1 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-semibold text-slate-900">
                        Batch: {batch.batchNumber}
                      </span>
                      <Badge variant={batch.quantity <= 10 ? 'warning' : 'success'} size="sm">
                        {batch.quantity} units left
                      </Badge>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                      <span>Exp: {batch.expiryDate}</span>
                      <span>Rate: {formatINR(batch.sellingPrice)} (MRP {formatINR(batch.mrp)})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Drawer>
      )}

      {/* Create New Medicine Modal */}
      <Modal
        isOpen={isNewMedOpen}
        onClose={() => setIsNewMedOpen(false)}
        title="Register New Medicine Master"
        description="Add pharmaceutical drug details, classification and initial batch stock"
        maxWidth="3xl"
      >
        <form onSubmit={handleCreateMedicine} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Brand / Commercial Name"
              placeholder="e.g. Augmentin 625 Duo"
              value={medName}
              onChange={(e) => setMedName(e.target.value)}
              required
              autoFocus
            />

            <Input
              label="Generic Molecule Formula"
              placeholder="e.g. Amoxicillin + Clavulanic Acid"
              value={medGeneric}
              onChange={(e) => setMedGeneric(e.target.value)}
              required
            />

            <Input
              label="Manufacturer / Pharma Brand"
              placeholder="e.g. GSK Pharma"
              value={medBrand}
              onChange={(e) => setMedBrand(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Therapeutic Class</label>
              <select
                value={medCategory}
                onChange={(e) => setMedCategory(e.target.value)}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-900"
              >
                {categories.filter(c => c !== 'All').map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Dosage Form</label>
              <select
                value={medForm}
                onChange={(e) => setMedForm(e.target.value)}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-900"
              >
                {dosageForms.filter(f => f !== 'All').map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            <Input
              label="Strength"
              placeholder="e.g. 625mg"
              value={medStrength}
              onChange={(e) => setMedStrength(e.target.value)}
            />

            <Input
              label="Pack Size"
              placeholder="e.g. 10 Tabs / Strip"
              value={medPackSize}
              onChange={(e) => setMedPackSize(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Input
              label="Rack Location"
              placeholder="e.g. A-01"
              value={medRack}
              onChange={(e) => setMedRack(e.target.value)}
            />

            <Input
              label="Barcode / EAN"
              placeholder="Scan barcode..."
              value={medBarcode}
              onChange={(e) => setMedBarcode(e.target.value)}
            />

            <Input
              label="Purchase Rate (₹)"
              type="number"
              step="any"
              value={medPurchasePrice}
              onChange={(e) => setMedPurchasePrice(e.target.value)}
            />

            <Input
              label="MRP (₹)"
              type="number"
              step="any"
              value={medMrp}
              onChange={(e) => setMedMrp(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Input
              label="POS Selling Rate (₹)"
              type="number"
              step="any"
              value={medSellingPrice}
              onChange={(e) => setMedSellingPrice(e.target.value)}
            />

            <Input
              label="GST Rate (%)"
              type="number"
              value={medGstRate}
              onChange={(e) => setMedGstRate(e.target.value)}
            />

            <Input
              label="Reorder Threshold"
              type="number"
              value={medReorder}
              onChange={(e) => setMedReorder(e.target.value)}
            />

            <div className="flex items-center gap-4 pt-4">
              <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  checked={medRxReq}
                  onChange={(e) => setMedRxReq(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Rx Required</span>
              </label>

              <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  checked={medScheduleH}
                  onChange={(e) => setMedScheduleH(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <span>Schedule H</span>
              </label>
            </div>
          </div>

          {/* Opening Batch Section */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <h4 className="text-xs font-semibold text-slate-900">
              Opening Initial Batch (Live Inventory)
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <Input
                label="Batch Number"
                placeholder="e.g. BAT-2026-01"
                value={initBatchNo}
                onChange={(e) => setInitBatchNo(e.target.value)}
              />
              <Input
                label="Opening Quantity"
                type="number"
                value={initBatchQty}
                onChange={(e) => setInitBatchQty(e.target.value)}
              />
              <Input
                label="Expiry Date"
                type="date"
                value={initBatchExp}
                onChange={(e) => setInitBatchExp(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsNewMedOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Medicine
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
