import React, { useState, useEffect, useRef } from 'react';
import { Customer } from '../../types';
import { customerService } from '../../services/customerService';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Search, UserPlus, Phone, Check } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { formatINR } from '../../utils/formatters';

interface CustomerSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCustomer: (customer: Customer) => void;
  selectedCustomerId?: string;
}

export const CustomerSelectModal: React.FC<CustomerSelectModalProps> = ({
  isOpen,
  onClose,
  onSelectCustomer,
  selectedCustomerId
}) => {
  const { addToast } = useAppStore();
  const [query, setQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // New customer form state
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newDoctor, setNewDoctor] = useState('');
  const [newCreditLimit, setNewCreditLimit] = useState('5000');

  useEffect(() => {
    if (isOpen) {
      loadCustomers(query);
      setIsCreatingNew(false);
    }
  }, [isOpen]);

  const loadCustomers = async (q: string) => {
    const list = await customerService.search(q);
    setCustomers(list);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => loadCustomers(val), 300);
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreating) return;
    if (!newName.trim() || !newPhone.trim()) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Name and Phone number are required.'
      });
      return;
    }

    setIsCreating(true);
    try {
      const created = await customerService.create({
        name: newName.trim(),
        phone: newPhone.trim(),
        email: newEmail.trim() || undefined,
        doctorName: newDoctor.trim() || undefined,
        creditLimit: parseFloat(newCreditLimit) || 0
      });

      addToast({
        type: 'success',
        title: 'Customer Added',
        message: `${created.name} registered and selected.`
      });

      onSelectCustomer(created);
      onClose();
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Could Not Add Customer',
        message: err instanceof Error ? err.message : 'Failed to create customer.'
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isCreatingNew ? 'Register New Patient / Customer' : 'Select Customer (F4)'}
      description={isCreatingNew ? 'Add patient contact for WhatsApp invoice & credit ledger' : 'Assign sale to customer account or search by mobile number'}
      maxWidth="md"
    >
      {!isCreatingNew ? (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Search by patient name, mobile number..."
              value={query}
              onChange={handleSearchChange}
              leftIcon={<Search className="w-4 h-4" />}
              autoFocus
            />
            <Button
              variant="outline"
              size="md"
              leftIcon={<UserPlus className="w-4 h-4" />}
              onClick={() => setIsCreatingNew(true)}
              className="shrink-0"
            >
              New
            </Button>
          </div>

          <div className="max-h-72 overflow-y-auto space-y-1 divide-y divide-slate-100">
            {customers.map((c) => {
              const isSelected = c.id === selectedCustomerId;
              return (
                <div
                  key={c.id}
                  onClick={() => {
                    onSelectCustomer(c);
                    onClose();
                  }}
                  className={`p-2.5 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-emerald-50 border border-emerald-300'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-900">
                        {c.name}
                      </span>
                      {c.outstandingBalance > 0 && (
                        <Badge variant="danger" size="sm">
                          Due: {formatINR(c.outstandingBalance)}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" /> {c.phone}
                      </span>
                      <span>•</span>
                      <span>Pts: {c.loyaltyPoints}</span>
                      {c.doctorName && (
                        <>
                          <span>•</span>
                          <span className="font-sans">Dr: {c.doctorName}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <form onSubmit={handleCreateCustomer} className="space-y-3">
          <Input
            label="Full Name"
            placeholder="e.g. Ramesh Patel"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
            autoFocus
          />

          <Input
            label="Phone / Mobile Number"
            placeholder="e.g. 9876543210"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            required
          />

          <Input
            label="Email Address (Optional)"
            placeholder="e.g. ramesh@example.com"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Consulting Doctor (Optional)"
              placeholder="e.g. Dr. Rajesh Sharma"
              value={newDoctor}
              onChange={(e) => setNewDoctor(e.target.value)}
            />
            <Input
              label="Credit Limit (₹)"
              type="number"
              value={newCreditLimit}
              onChange={(e) => setNewCreditLimit(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreatingNew(false)}
              disabled={isCreating}
            >
              Back
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isCreating}>
              Save Customer
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

