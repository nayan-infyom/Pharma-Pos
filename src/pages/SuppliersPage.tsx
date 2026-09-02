import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supplierService } from '../services/supplierService';
import { Supplier } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { 
  Search, 
  Plus
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { formatINR } from '../utils/formatters';

export const SuppliersPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useAppStore();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewSupplierOpen, setIsNewSupplierOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('0');

  // New supplier form
  const [supName, setSupName] = useState('');
  const [supContact, setSupContact] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supGstin, setSupGstin] = useState('');
  const [supDl, setSupDl] = useState('');
  const [supAddress, setSupAddress] = useState('');

  useEffect(() => {
    loadSuppliers();
    if (searchParams.get('action') === 'new') {
      setIsNewSupplierOpen(true);
      setSearchParams({});
    }
  }, []);

  const loadSuppliers = async () => {
    const list = await supplierService.getAll();
    setSuppliers(list);
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim() || !supPhone.trim()) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Supplier name and contact phone are required.'
      });
      return;
    }

    const created = await supplierService.create({
      name: supName.trim(),
      contactPerson: supContact.trim() || 'Wholesale Agent',
      phone: supPhone.trim(),
      email: supEmail.trim() || 'orders@wholesaler.com',
      gstin: supGstin.trim() || '27AABCS9912E1Z8',
      drugLicenseNumber: supDl.trim() || 'DL-20B/21B-44912',
      drugLicense: supDl.trim() || 'DL-20B/21B-44912',
      address: supAddress.trim() || 'Industrial Pharma Estate',
      status: 'Active',
      creditDays: 30,
      outstandingAmount: 0
    });

    addToast({
      type: 'success',
      title: 'Supplier Added',
      message: `${created.name} registered in directory.`
    });

    setIsNewSupplierOpen(false);
    resetForm();
    loadSuppliers();
  };

  const resetForm = () => {
    setSupName('');
    setSupContact('');
    setSupPhone('');
    setSupEmail('');
    setSupGstin('');
    setSupDl('');
    setSupAddress('');
  };

  const handlePaySupplier = async () => {
    if (!selectedSupplier) return;
    const amount = parseFloat(payAmount) || 0;
    if (amount <= 0) return;

    await supplierService.updateBalance(selectedSupplier.id, -amount);
    addToast({
      type: 'success',
      title: 'Wholesale Payment Recorded',
      message: `${formatINR(amount)} disbursed to ${selectedSupplier.name}.`
    });

    setIsPayModalOpen(false);
    loadSuppliers();
  };

  const filteredSuppliers = suppliers.filter(s => {
    const query = (searchQuery || '').toLowerCase().trim();
    if (!query) return true;
    return (
      (s.name || '').toLowerCase().includes(query) ||
      (s.contactPerson || '').toLowerCase().includes(query) ||
      (s.phone || '').includes(query) ||
      (s.gstin || '').toLowerCase().includes(query)
    );
  });

  const totalPayable = suppliers.reduce((sum, s) => sum + s.outstandingBalance, 0);

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Wholesale Suppliers Directory
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Licensed drug stockists, GSTIN compliance records & wholesale accounts payable
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          onClick={() => setIsNewSupplierOpen(true)}
        >
          Add Supplier
        </Button>
      </div>

      {/* Overview Stat Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Registered Stockists</span>
          <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
            {suppliers.length} Vendors
          </div>
          <span className="text-[11px] text-slate-400">Verified Drug Licenses</span>
        </div>

        <div className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Accounts Payable Due</span>
          <div className="text-lg font-bold font-mono text-rose-600 mt-0.5">
            {formatINR(totalPayable)}
          </div>
          <span className="text-[11px] text-slate-400">Payable to wholesale distributors</span>
        </div>

        <div className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Supply Lines Health</span>
          <div className="text-lg font-bold font-mono text-teal-700 mt-0.5">
            100% Active
          </div>
          <span className="text-[11px] text-slate-400">FEFO batch tracking enabled</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-3 rounded-xl border border-slate-200 bg-white shadow-2xs">
        <Input
          placeholder="Search supplier name, contact person, phone, GSTIN..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="w-4 h-4" />}
          className="text-xs"
        />
      </div>

      {/* Suppliers Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3.5 font-semibold">Wholesaler / Company</th>
                <th className="py-2.5 px-3.5 font-semibold">Contact Person</th>
                <th className="py-2.5 px-3.5 font-semibold">Contact Numbers</th>
                <th className="py-2.5 px-3.5 font-semibold">GSTIN / DL #</th>
                <th className="py-2.5 px-3.5 font-semibold text-right">Outstanding Due</th>
                <th className="py-2.5 px-3.5 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSuppliers.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3.5">
                    <div className="font-semibold text-slate-900">{s.name}</div>
                    <div className="text-[10px] text-slate-400 truncate max-w-xs">{s.address}</div>
                  </td>
                  <td className="py-2.5 px-3.5 text-slate-700">
                    {s.contactPerson}
                  </td>
                  <td className="py-2.5 px-3.5 font-mono">
                    <div className="text-slate-900">{s.phone}</div>
                    <div className="text-[10px] text-slate-400 font-sans">{s.email}</div>
                  </td>
                  <td className="py-2.5 px-3.5 font-mono text-[11px]">
                    <div className="text-slate-900 font-semibold">{s.gstin}</div>
                    <div className="text-slate-400">{s.drugLicenseNumber}</div>
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-mono font-bold">
                    <span className={s.outstandingBalance > 0 ? 'text-rose-600' : 'text-slate-400'}>
                      {formatINR(s.outstandingBalance)}
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 text-center">
                    {s.outstandingBalance > 0 ? (
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => {
                          setSelectedSupplier(s);
                          setPayAmount(s.outstandingBalance.toString());
                          setIsPayModalOpen(true);
                        }}
                      >
                        Settle Due
                      </Button>
                    ) : (
                      <Badge variant="success" size="sm">Settled</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pay Supplier Modal */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title="Disburse Supplier Payment"
        description={`Vendor: ${selectedSupplier?.name} • Due: ${formatINR(selectedSupplier?.outstandingBalance || 0)}`}
        maxWidth="sm"
      >
        <div className="space-y-3">
          <Input
            label="Payment Amount Disbursed (₹)"
            type="number"
            step="any"
            value={payAmount}
            onChange={(e) => setPayAmount(e.target.value)}
            autoFocus
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <Button variant="outline" size="sm" onClick={() => setIsPayModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handlePaySupplier}>
              Record Disbursement
            </Button>
          </div>
        </div>
      </Modal>

      {/* Register Supplier Modal */}
      <Modal
        isOpen={isNewSupplierOpen}
        onClose={() => setIsNewSupplierOpen(false)}
        title="Register Wholesale Distributor"
        description="Save wholesale supplier details for purchasing and inward stock"
        maxWidth="xl"
      >
        <form onSubmit={handleCreateSupplier} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <Input
              label="Distributor Company Name"
              placeholder="e.g. MedVance Biologicals Ltd"
              value={supName}
              onChange={(e) => setSupName(e.target.value)}
              required
              autoFocus
            />

            <Input
              label="Contact Representative"
              placeholder="e.g. Robert Miller"
              value={supContact}
              onChange={(e) => setSupContact(e.target.value)}
            />

            <Input
              label="Telephone / Mobile"
              placeholder="e.g. 9812345678"
              value={supPhone}
              onChange={(e) => setSupPhone(e.target.value)}
              required
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. orders@medvance.com"
              value={supEmail}
              onChange={(e) => setSupEmail(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <Input
              label="GSTIN Tax Identification"
              placeholder="e.g. 27AABCS9912E1Z8"
              value={supGstin}
              onChange={(e) => setSupGstin(e.target.value)}
            />

            <Input
              label="Drug Wholesale License (DL)"
              placeholder="e.g. DL-20B/21B-44912"
              value={supDl}
              onChange={(e) => setSupDl(e.target.value)}
            />
          </div>

          <Input
            label="Warehouse / Business Address"
            placeholder="e.g. 102 Sector 4 Pharma Zone, Mumbai"
            value={supAddress}
            onChange={(e) => setSupAddress(e.target.value)}
          />

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsNewSupplierOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Wholesaler
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
