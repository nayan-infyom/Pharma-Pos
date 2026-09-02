import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { customerService } from '../services/customerService';
import { Customer } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Drawer } from '../components/ui/Drawer';
import { 
  Search, 
  Plus, 
  AlertOctagon, 
  Eye, 
  ShoppingCart
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { usePOSStore } from '../store/usePOSStore';
import { formatINR } from '../utils/formatters';

export const CustomersPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useAppStore();
  const { setCustomer } = usePOSStore();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isNewCustOpen, setIsNewCustOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [settleAmount, setSettleAmount] = useState('0');

  // Form state
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custAllergies, setCustAllergies] = useState('');
  const [custConditions, setCustConditions] = useState('');
  const [custCreditLimit, setCustCreditLimit] = useState('5000');

  useEffect(() => {
    loadCustomers();
    if (searchParams.get('action') === 'new') {
      setIsNewCustOpen(true);
      setSearchParams({});
    }
  }, []);

  const loadCustomers = async () => {
    const list = await customerService.getAll();
    setCustomers(list);
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim() || !custPhone.trim()) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Customer name and phone number are required.'
      });
      return;
    }

    const allergiesArr = custAllergies.split(',').map(s => s.trim()).filter(Boolean);
    const conditionsArr = custConditions.split(',').map(s => s.trim()).filter(Boolean);

    const created = await customerService.create({
      name: custName.trim(),
      phone: custPhone.trim(),
      email: custEmail.trim() || undefined,
      address: custAddress.trim() || undefined,
      allergies: allergiesArr,
      chronicConditions: conditionsArr,
      creditLimit: parseFloat(custCreditLimit) || 5000,
      loyaltyPoints: 0,
      outstandingBalance: 0
    });

    addToast({
      type: 'success',
      title: 'Patient Account Created',
      message: `${created.name} added to pharmacy registry.`
    });

    setIsNewCustOpen(false);
    resetForm();
    loadCustomers();
  };

  const resetForm = () => {
    setCustName('');
    setCustPhone('');
    setCustEmail('');
    setCustAddress('');
    setCustAllergies('');
    setCustConditions('');
  };

  const handleSettleBalance = async () => {
    if (!selectedCustomer) return;
    const amount = parseFloat(settleAmount) || 0;
    if (amount <= 0) return;

    await customerService.updateBalance(selectedCustomer.id, -amount);
    addToast({
      type: 'success',
      title: 'Khata Payment Recorded',
      message: `${formatINR(amount)} credited to ${selectedCustomer.name}'s ledger.`
    });

    setIsSettleModalOpen(false);
    loadCustomers();
    const updated = await customerService.getById(selectedCustomer.id);
    if (updated) setSelectedCustomer(updated);
  };

  const filteredCustomers = customers.filter(c => {
    const query = (searchQuery || '').toLowerCase().trim();
    if (!query) return true;
    return (
      (c.name || '').toLowerCase().includes(query) ||
      (c.phone || '').includes(query) ||
      (c.email && c.email.toLowerCase().includes(query)) ||
      c.chronicConditions?.some(cond => (cond || '').toLowerCase().includes(query)) ||
      c.allergies?.some(al => (al || '').toLowerCase().includes(query))
    );
  });

  const totalOutstanding = customers.reduce((sum, c) => sum + c.outstandingBalance, 0);
  const totalPoints = customers.reduce((sum, c) => sum + c.loyaltyPoints, 0);

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Customers & Chronic Patients
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage patient health profiles, recorded drug allergies, credit ledgers (Khata) and loyalty points
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          onClick={() => setIsNewCustOpen(true)}
        >
          Register Patient
        </Button>
      </div>

      {/* Overview Stat Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Registered Patients</span>
          <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
            {customers.length} Patients
          </div>
          <span className="text-[11px] text-slate-400">With medical records</span>
        </div>

        <div className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Khata Credit Due</span>
          <div className="text-lg font-bold font-mono text-amber-700 mt-0.5">
            {formatINR(totalOutstanding)}
          </div>
          <span className="text-[11px] text-slate-400">Total customer balance receivable</span>
        </div>

        <div className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Loyalty Pool</span>
          <div className="text-lg font-bold font-mono text-teal-700 mt-0.5">
            {totalPoints.toLocaleString()} pts
          </div>
          <span className="text-[11px] text-slate-400">Redeemable at billing</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-3 rounded-xl border border-slate-200 bg-white shadow-2xs">
        <Input
          placeholder="Search patient name, mobile number, chronic condition (e.g. Diabetes), drug allergy (e.g. Penicillin)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="w-4 h-4" />}
          className="text-xs"
        />
      </div>

      {/* Customers Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3.5 font-semibold">Patient Name</th>
                <th className="py-2.5 px-3.5 font-semibold">Contact</th>
                <th className="py-2.5 px-3.5 font-semibold">Chronic Care / Allergies</th>
                <th className="py-2.5 px-3.5 font-semibold text-right">Loyalty Pts</th>
                <th className="py-2.5 px-3.5 font-semibold text-right">Khata Due</th>
                <th className="py-2.5 px-3.5 font-semibold text-right">Total Spent</th>
                <th className="py-2.5 px-3.5 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3.5">
                    <div className="font-semibold text-slate-900">{c.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">ID: {c.id.slice(-4)}</div>
                  </td>
                  <td className="py-2.5 px-3.5 font-mono">
                    <div className="text-slate-900">{c.phone}</div>
                    {c.email && <div className="text-[10px] text-slate-400 font-sans">{c.email}</div>}
                  </td>
                  <td className="py-2.5 px-3.5">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {c.allergies && c.allergies.length > 0 && (
                        c.allergies.map(al => (
                          <Badge key={al} variant="danger" size="sm">Allergy: {al}</Badge>
                        ))
                      )}
                      {c.chronicConditions && c.chronicConditions.length > 0 && (
                        c.chronicConditions.map(cond => (
                          <Badge key={cond} variant="teal" size="sm">{cond}</Badge>
                        ))
                      )}
                      {(!c.allergies || c.allergies.length === 0) && (!c.chronicConditions || c.chronicConditions.length === 0) && (
                        <span className="text-slate-400 text-[11px]">-</span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-mono font-semibold text-teal-700">
                    {c.loyaltyPoints}
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-mono font-bold">
                    <span className={c.outstandingBalance > 0 ? 'text-amber-700' : 'text-slate-400'}>
                      {formatINR(c.outstandingBalance)}
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-mono font-semibold text-slate-900">
                    {formatINR(c.totalSpent)}
                  </td>
                  <td className="py-2.5 px-3.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="xs"
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                        onClick={() => setSelectedCustomer(c)}
                      >
                        Profile
                      </Button>

                      <Button
                        variant="ghost"
                        size="xs"
                        leftIcon={<ShoppingCart className="w-3.5 h-3.5 text-emerald-600" />}
                        onClick={() => {
                          setCustomer(c);
                          addToast({
                            type: 'info',
                            title: 'Customer Selected',
                            message: `${c.name} assigned to active POS terminal.`
                          });
                          navigate('/pos');
                        }}
                      >
                        Bill
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Patient Profile Drawer */}
      {selectedCustomer && (
        <Drawer
          isOpen={!!selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          title={selectedCustomer.name}
          description={`Patient ID: ${selectedCustomer.id} • Registered patient`}
          width="lg"
        >
          <div className="space-y-3.5 text-xs">
            {/* Health warnings */}
            {selectedCustomer.allergies && selectedCustomer.allergies.length > 0 && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-rose-800">
                  <AlertOctagon className="w-4 h-4" />
                  <span>Documented Drug Allergies (CRITICAL)</span>
                </div>
                <div className="flex flex-wrap gap-1 pt-1">
                  {selectedCustomer.allergies.map(al => (
                    <Badge key={al} variant="danger" size="sm">{al}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* General metrics */}
            <div className="grid grid-cols-2 gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div>
                <span className="text-slate-500">Mobile Phone:</span>
                <p className="font-mono font-semibold text-slate-900">{selectedCustomer.phone}</p>
              </div>
              <div>
                <span className="text-slate-500">Email Address:</span>
                <p className="font-semibold text-slate-900">{selectedCustomer.email || 'N/A'}</p>
              </div>
              <div>
                <span className="text-slate-500">Loyalty Points:</span>
                <p className="font-mono font-semibold text-teal-700">{selectedCustomer.loyaltyPoints} points</p>
              </div>
              <div>
                <span className="text-slate-500">Credit Limit:</span>
                <p className="font-mono font-semibold text-slate-900">{formatINR(selectedCustomer.creditLimit)}</p>
              </div>
            </div>

            {/* Khata Ledger Balance Card */}
            <div className="p-3.5 rounded-lg border border-amber-200 bg-amber-50 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-amber-900">
                  Khata Outstanding Balance
                </span>
                <div className="text-lg font-mono font-bold text-amber-800 mt-0.5">
                  {formatINR(selectedCustomer.outstandingBalance)}
                </div>
              </div>

              {selectedCustomer.outstandingBalance > 0 && (
                <Button
                  variant="primary"
                  size="xs"
                  onClick={() => {
                    setSettleAmount(selectedCustomer.outstandingBalance.toString());
                    setIsSettleModalOpen(true);
                  }}
                >
                  Receive Payment
                </Button>
              )}
            </div>

            {/* Chronic Conditions */}
            <div>
              <h4 className="font-semibold text-slate-900 mb-1">
                Chronic Health Conditions
              </h4>
              <div className="flex flex-wrap gap-1">
                {selectedCustomer.chronicConditions && selectedCustomer.chronicConditions.length > 0 ? (
                  selectedCustomer.chronicConditions.map(c => (
                    <Badge key={c} variant="teal" size="sm">{c}</Badge>
                  ))
                ) : (
                  <span className="text-slate-400">No chronic conditions listed.</span>
                )}
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-3 border-t border-slate-200 flex justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCustomer(null)}
              >
                Close
              </Button>

              <Button
                variant="primary"
                size="sm"
                leftIcon={<ShoppingCart className="w-3.5 h-3.5" />}
                onClick={() => {
                  setCustomer(selectedCustomer);
                  setSelectedCustomer(null);
                  navigate('/pos');
                }}
              >
                Open POS Cart
              </Button>
            </div>
          </div>
        </Drawer>
      )}

      {/* Settle Khata Payment Modal */}
      <Modal
        isOpen={isSettleModalOpen}
        onClose={() => setIsSettleModalOpen(false)}
        title={`Receive Khata Balance Payment`}
        description={`Customer: ${selectedCustomer?.name} (Due: ${formatINR(selectedCustomer?.outstandingBalance || 0)})`}
        maxWidth="sm"
      >
        <div className="space-y-3">
          <Input
            label="Payment Amount Received (₹)"
            type="number"
            step="any"
            value={settleAmount}
            onChange={(e) => setSettleAmount(e.target.value)}
            autoFocus
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <Button variant="outline" size="sm" onClick={() => setIsSettleModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSettleBalance}>
              Confirm Received
            </Button>
          </div>
        </div>
      </Modal>

      {/* Register Customer Modal */}
      <Modal
        isOpen={isNewCustOpen}
        onClose={() => setIsNewCustOpen(false)}
        title="Register Patient Profile"
        description="Record demographic details, allergies & chronic medical conditions"
        maxWidth="xl"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <Input
              label="Full Name"
              placeholder="e.g. Eleanor Vance"
              value={custName}
              onChange={(e) => setCustName(e.target.value)}
              required
              autoFocus
            />

            <Input
              label="Mobile Phone Number"
              placeholder="e.g. 9812345678"
              value={custPhone}
              onChange={(e) => setCustPhone(e.target.value)}
              required
            />

            <Input
              label="Email Address (Optional)"
              type="email"
              placeholder="e.g. patient@example.com"
              value={custEmail}
              onChange={(e) => setCustEmail(e.target.value)}
            />

            <Input
              label="Credit (Khata) Limit (₹)"
              type="number"
              value={custCreditLimit}
              onChange={(e) => setCustCreditLimit(e.target.value)}
            />
          </div>

          <Input
            label="Residential Address"
            placeholder="e.g. 45 Pine Hill Road"
            value={custAddress}
            onChange={(e) => setCustAddress(e.target.value)}
          />

          <Input
            label="Known Drug Allergies (Comma-separated)"
            placeholder="e.g. Penicillin, Sulfa drugs, Aspirin"
            value={custAllergies}
            onChange={(e) => setCustAllergies(e.target.value)}
          />

          <Input
            label="Chronic Conditions (Comma-separated)"
            placeholder="e.g. Type 2 Diabetes, Hypertension, Asthma"
            value={custConditions}
            onChange={(e) => setCustConditions(e.target.value)}
          />

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsNewCustOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Patient Profile
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
