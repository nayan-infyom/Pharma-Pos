import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { employeeService } from '../services/employeeService';
import { Employee, Permission } from '../types';
import { ApiError, Pagination as PaginationMeta } from '../api/client';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import {
  Plus,
  ShieldCheck,
  Phone,
  Clock,
  Search,
  Pencil,
  Loader2
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const PAGE_SIZE = 20;

const PERMISSION_OPTIONS: { value: Permission; label: string }[] = [
  { value: 'view_pos', label: 'View POS' },
  { value: 'create_sale', label: 'Create Sale' },
  { value: 'refund_sale', label: 'Refund Sale' },
  { value: 'view_inventory', label: 'View Inventory' },
  { value: 'adjust_inventory', label: 'Adjust Inventory' },
  { value: 'manage_medicines', label: 'Manage Medicines' },
  { value: 'manage_purchases', label: 'Manage Purchases' },
  { value: 'view_reports', label: 'View Reports' },
  { value: 'manage_employees', label: 'Manage Employees' },
  { value: 'manage_settings', label: 'Manage Settings' }
];

// Smart defaults only — the picker below always allows full manual
// adjustment. Admin/Chief Pharmacist/Cashier/Inventory Specialist mirror the
// original src/data/employees.ts seed exactly; the other three roles never
// had seed precedent, so these are a reasonable judgment call, not an
// established rule (flagged in the batch report).
const ROLE_DEFAULT_PERMISSIONS: Record<Employee['role'], Permission[]> = {
  'Admin': PERMISSION_OPTIONS.map(p => p.value),
  'Chief Pharmacist': ['view_pos', 'create_sale', 'refund_sale', 'view_inventory', 'adjust_inventory', 'manage_medicines', 'manage_purchases', 'view_reports'],
  'Staff Pharmacist': ['view_pos', 'create_sale', 'view_inventory', 'manage_medicines'],
  'Cashier': ['view_pos', 'create_sale', 'view_inventory'],
  'Inventory Specialist': ['view_inventory', 'adjust_inventory', 'manage_medicines', 'manage_purchases'],
  'Pharmacist': ['view_pos', 'create_sale', 'view_inventory', 'manage_medicines'],
  'Inventory Manager': ['view_inventory', 'adjust_inventory', 'manage_purchases']
};

const ROLES: Employee['role'][] = ['Admin', 'Chief Pharmacist', 'Staff Pharmacist', 'Pharmacist', 'Cashier', 'Inventory Specialist', 'Inventory Manager'];

export const EmployeesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser, addToast } = useAppStore();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const [isNewEmpOpen, setIsNewEmpOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<Employee['role']>('Cashier');
  const [status, setStatus] = useState<Employee['status']>('Active');
  const [license, setLicense] = useState('');
  const [shift, setShift] = useState('Morning (08:00 - 16:00)');
  const [cashDrawerLimit, setCashDrawerLimit] = useState('10000');
  const [permissions, setPermissions] = useState<Permission[]>(ROLE_DEFAULT_PERMISSIONS.Cashier);

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setIsNewEmpOpen(true);
      setSearchParams({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadEmployees(page, searchQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const loadEmployees = async (targetPage: number, search: string) => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const { items, pagination: p } = await employeeService.list({ search: search || undefined, page: targetPage, limit: PAGE_SIZE });
      setEmployees(items);
      setPagination(p);
    } catch (err) {
      setLoadError(err instanceof ApiError ? (err.code === 'FORBIDDEN' ? "You don't have permission to view staff records." : err.message) : 'Failed to load employees.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setPage(1);
      loadEmployees(1, val);
    }, 300);
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setRole('Cashier');
    setStatus('Active');
    setLicense('');
    setShift('Morning (08:00 - 16:00)');
    setCashDrawerLimit('10000');
    setPermissions(ROLE_DEFAULT_PERMISSIONS.Cashier);
  };

  const openCreate = () => {
    resetForm();
    setEditingEmployee(null);
    setIsNewEmpOpen(true);
  };

  const openEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setName(emp.name);
    setEmail(emp.email);
    setPhone(emp.phone);
    setRole(emp.role);
    setStatus(emp.status);
    setLicense(emp.licenseNumber || '');
    setShift(emp.shiftTiming || 'Morning (08:00 - 16:00)');
    setCashDrawerLimit(String(emp.cashDrawerLimit ?? 10000));
    setPermissions(emp.permissions.filter((p): p is Permission => PERMISSION_OPTIONS.some(o => o.value === p)));
    setIsNewEmpOpen(true);
  };

  const togglePermission = (perm: Permission) => {
    setPermissions((prev) => (prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    if (!name.trim() || !email.trim()) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Name and email are required.'
      });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || '9876543210',
        role,
        status,
        licenseNumber: license.trim() || undefined,
        shiftTiming: shift,
        cashDrawerLimit: parseFloat(cashDrawerLimit) || 0,
        permissions
      };

      if (editingEmployee) {
        const updated = await employeeService.update(editingEmployee.id, payload);
        addToast({ type: 'success', title: 'Employee Updated', message: `${updated.name}'s profile was saved.` });
      } else {
        const created = await employeeService.create(payload);
        addToast({ type: 'success', title: 'Employee Registered', message: `${created.name} added as ${created.role}.` });
      }

      setIsNewEmpOpen(false);
      setEditingEmployee(null);
      resetForm();
      loadEmployees(page, searchQuery);
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Could Not Save Employee',
        message: err instanceof ApiError ? err.message : 'Failed to save employee record.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/80">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Pharmacy Staff & Role Permissions
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage registered pharmacists, cashiers, shift allocations and system access
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          onClick={openCreate}
        >
          Add Staff Member
        </Button>
      </div>

      {/* Search Bar */}
      <div className="p-3 rounded-xl border border-slate-200 bg-white shadow-2xs">
        <Input
          placeholder="Search staff name or email..."
          value={searchQuery}
          onChange={handleSearchChange}
          leftIcon={<Search className="w-4 h-4" />}
          className="text-xs"
        />
      </div>

      {/* Staff Grid */}
      {loadError ? (
        <div className="p-6 text-center text-xs text-rose-600 rounded-xl border border-slate-200 bg-white">
          {loadError}{' '}
          <button className="underline font-semibold" onClick={() => loadEmployees(page, searchQuery)}>Retry</button>
        </div>
      ) : isLoading ? (
        <div className="p-10 flex items-center justify-center text-slate-400 rounded-xl border border-slate-200 bg-white"><Loader2 className="w-5 h-5 animate-spin" /></div>
      ) : employees.length === 0 ? (
        <div className="p-10 text-center text-xs text-slate-400 rounded-xl border border-slate-200 bg-white">No staff members match your search.</div>
      ) : (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {employees.map((emp) => {
            const isCurrent = currentUser.id === emp.id;
            return (
              <div
                key={emp.id}
                className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                  isCurrent
                    ? 'border-emerald-600 bg-emerald-50/30 ring-1 ring-emerald-600/30'
                    : 'border-slate-200/90 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700">
                      {emp.name.charAt(0)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge
                        variant={emp.role === 'Admin' ? 'danger' : emp.role === 'Chief Pharmacist' || emp.role === 'Pharmacist' || emp.role === 'Staff Pharmacist' ? 'teal' : 'default'}
                        size="sm"
                      >
                        {emp.role}
                      </Badge>
                      <button
                        type="button"
                        onClick={() => openEdit(emp)}
                        className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-slate-50 rounded cursor-pointer"
                        title="Edit staff profile"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-semibold text-xs text-slate-900">{emp.name}</h3>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">{emp.email}</p>

                  <div className="mt-2.5 space-y-1 text-xs text-slate-500 border-t border-slate-100 pt-2">
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{emp.phone}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{emp.shiftTiming || 'Unscheduled'}</span>
                    </div>
                    {emp.licenseNumber && (
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-700">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Lic: {emp.licenseNumber}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1.5">
                  <Badge variant={emp.status === 'Active' ? 'success' : emp.status === 'On Leave' ? 'warning' : 'default'} size="sm">
                    {emp.status}
                  </Badge>
                  {isCurrent && (
                    <Badge variant="success" size="sm">
                      Active Session
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {pagination && <Pagination pagination={pagination} onPageChange={setPage} itemLabel="staff" />}
        </>
      )}

      {/* Add / Edit Employee Modal */}
      <Modal
        isOpen={isNewEmpOpen}
        onClose={() => { setIsNewEmpOpen(false); setEditingEmployee(null); }}
        title={editingEmployee ? `Edit Staff Profile — ${editingEmployee.name}` : 'Register Staff Member'}
        description="Assign pharmacy role, shift timing & system access"
        maxWidth="lg"
      >
        <form onSubmit={handleSave} className="space-y-3">
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
              <label className="text-xs font-semibold text-slate-700 block mb-1">Assigned Role</label>
              <select
                value={role}
                onChange={(e) => {
                  const nextRole = e.target.value as Employee['role'];
                  setRole(nextRole);
                  if (!editingEmployee) setPermissions(ROLE_DEFAULT_PERMISSIONS[nextRole]);
                }}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold"
              >
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Employee['status'])}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold"
              >
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Shift Timing</label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value)}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold"
              >
                <option value="Morning (08:00 - 16:00)">Morning (08:00 - 16:00)</option>
                <option value="Evening (16:00 - 00:00)">Evening (16:00 - 00:00)</option>
                <option value="Night (00:00 - 08:00)">Night (00:00 - 08:00)</option>
              </select>
            </div>

            <Input
              label="Cash Drawer Limit (₹)"
              type="number"
              value={cashDrawerLimit}
              onChange={(e) => setCashDrawerLimit(e.target.value)}
            />
          </div>

          <Input
            label="Pharmacist License Number (If applicable)"
            placeholder="e.g. PHARM-MH-29931"
            value={license}
            onChange={(e) => setLicense(e.target.value)}
          />

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">System Access Permissions</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 p-2.5 rounded-lg border border-slate-200 bg-slate-50/50">
              {PERMISSION_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-1.5 text-[11px] font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.includes(opt.value)}
                    onChange={() => togglePermission(opt.value)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => { setIsNewEmpOpen(false); setEditingEmployee(null); }} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
              {editingEmployee ? 'Save Changes' : 'Save Staff Profile'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
