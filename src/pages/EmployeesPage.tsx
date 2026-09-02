import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { employeeService } from '../services/employeeService';
import { Employee } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { 
  Plus, 
  ShieldCheck, 
  UserCheck, 
  Phone, 
  Clock
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const EmployeesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser, setCurrentUser, addToast } = useAppStore();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isNewEmpOpen, setIsNewEmpOpen] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<Employee['role']>('Cashier');
  const [license, setLicense] = useState('');
  const [shift, setShift] = useState('Morning (08:00 - 16:00)');

  useEffect(() => {
    loadEmployees();
    if (searchParams.get('action') === 'new') {
      setIsNewEmpOpen(true);
      setSearchParams({});
    }
  }, []);

  const loadEmployees = async () => {
    const list = await employeeService.getAll();
    setEmployees(list);
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Name and email are required.'
      });
      return;
    }

    const created = await employeeService.create({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || '9876543210',
      role,
      status: 'Active',
      licenseNumber: license.trim() || undefined,
      shiftTiming: shift,
      cashDrawerLimit: role === 'Cashier' ? 10000 : 50000,
      permissions: role === 'Admin' ? ['all'] : role === 'Pharmacist' ? ['pos', 'rx', 'inventory'] : ['pos']
    });

    addToast({
      type: 'success',
      title: 'Employee Registered',
      message: `${created.name} added as ${created.role}.`
    });

    setIsNewEmpOpen(false);
    resetForm();
    loadEmployees();
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setLicense('');
  };

  const handleSwitchOperator = (emp: Employee) => {
    setCurrentUser(emp);
    addToast({
      type: 'info',
      title: 'Operator Switched',
      message: `Active session logged in as ${emp.name} (${emp.role}).`
    });
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Pharmacy Staff & Role Permissions
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage registered pharmacists, cashiers, shift allocations and system access
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          onClick={() => setIsNewEmpOpen(true)}
        >
          Add Staff Member
        </Button>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {employees.map((emp) => {
          const isCurrent = currentUser.id === emp.id;
          return (
            <div
              key={emp.id}
              className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                isCurrent
                  ? 'border-emerald-600 bg-emerald-50/30 dark:bg-emerald-950/20 ring-1 ring-emerald-600/30'
                  : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-300">
                    {emp.name.charAt(0)}
                  </div>
                  <Badge
                    variant={emp.role === 'Admin' ? 'danger' : emp.role === 'Pharmacist' ? 'teal' : 'default'}
                    size="sm"
                  >
                    {emp.role}
                  </Badge>
                </div>

                <h3 className="font-semibold text-xs text-slate-900 dark:text-slate-100">{emp.name}</h3>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">{emp.email}</p>

                <div className="mt-2.5 space-y-1 text-xs text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-2">
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{emp.phone}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{emp.shiftTiming}</span>
                  </div>
                  {emp.licenseNumber && (
                    <div className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-700 dark:text-emerald-400">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Lic: {emp.licenseNumber}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                {isCurrent ? (
                  <Badge variant="success" size="sm" className="w-full justify-center">
                    Active Session
                  </Badge>
                ) : (
                  <Button
                    variant="outline"
                    size="xs"
                    className="w-full"
                    leftIcon={<UserCheck className="w-3.5 h-3.5" />}
                    onClick={() => handleSwitchOperator(emp)}
                  >
                    Switch to {emp.name.split(' ')[0]}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Employee Modal */}
      <Modal
        isOpen={isNewEmpOpen}
        onClose={() => setIsNewEmpOpen(false)}
        title="Register Staff Member"
        description="Assign pharmacy role, shift timing & system access"
        maxWidth="md"
      >
        <form onSubmit={handleCreateEmployee} className="space-y-3">
          <Input
            label="Full Name"
            placeholder="e.g. David Vance"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="e.g. david@apexpharma.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Contact Phone"
            placeholder="e.g. 9876543210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Assigned Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold"
              >
                <option value="Cashier">Cashier</option>
                <option value="Pharmacist">Licensed Pharmacist</option>
                <option value="Admin">Administrator / Owner</option>
                <option value="Inventory Manager">Inventory Manager</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Shift Timing</label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value)}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold"
              >
                <option value="Morning (08:00 - 16:00)">Morning (08:00 - 16:00)</option>
                <option value="Evening (16:00 - 00:00)">Evening (16:00 - 00:00)</option>
                <option value="Night (00:00 - 08:00)">Night (00:00 - 08:00)</option>
              </select>
            </div>
          </div>

          <Input
            label="Pharmacist License Number (If applicable)"
            placeholder="e.g. PHARM-MH-29931"
            value={license}
            onChange={(e) => setLicense(e.target.value)}
          />

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsNewEmpOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Staff Profile
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
