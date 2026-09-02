import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { usePOSStore } from '../../store/usePOSStore';
import { medicineService } from '../../services/medicineService';
import { customerService } from '../../services/customerService';
import { salesService } from '../../services/salesService';
import { supplierService } from '../../services/supplierService';
import { purchaseService } from '../../services/purchaseService';
import { prescriptionService } from '../../services/prescriptionService';
import { Medicine, Customer, SaleInvoice, Supplier, PurchaseOrder, Prescription } from '../../types';
import { Search, Pill, Users, Receipt, Building2, ShoppingCart, ArrowRight, X, FileText, Check } from 'lucide-react';
import { Kbd } from '../ui/Kbd';
import { Badge } from '../ui/Badge';
import { formatINR } from '../../utils/formatters';

export const GlobalSearchModal: React.FC = () => {
  const { globalSearchOpen, setGlobalSearchOpen, addToast } = useAppStore();
  const { addItem, setCustomer, setDoctorName, clearCart } = usePOSStore();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<SaleInvoice[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<PurchaseOrder[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setGlobalSearchOpen(!globalSearchOpen);
      }
      if (e.key === 'Escape' && globalSearchOpen) {
        setGlobalSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [globalSearchOpen, setGlobalSearchOpen]);

  useEffect(() => {
    if (globalSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      searchAll(query || '');
      setSelectedIndex(0);
    } else {
      setQuery('');
    }
  }, [globalSearchOpen]);

  const searchAll = async (q: string) => {
    const [allMeds, allCusts, allSales, allSups, allPurch, allRx] = await Promise.all([
      medicineService.search(q || ''),
      customerService.search(q || ''),
      salesService.getAll(),
      supplierService.search(q || ''),
      purchaseService.getAll(),
      prescriptionService.getAll()
    ]);

    const qLower = (q || '').toLowerCase().trim();

    setMedicines(allMeds.slice(0, 5));
    setCustomers(allCusts.slice(0, 4));
    
    if (qLower) {
      setInvoices(
        allSales
          .filter(s => (s.invoiceNumber || '').toLowerCase().includes(qLower) || (s.customerName || '').toLowerCase().includes(qLower))
          .slice(0, 4)
      );
      setPurchases(
        allPurch
          .filter(p => (p.invoiceNumber || '').toLowerCase().includes(qLower) || (p.supplierName || '').toLowerCase().includes(qLower))
          .slice(0, 3)
      );
      setPrescriptions(
        allRx
          .filter(r => (r.customerName || r.patientName || '').toLowerCase().includes(qLower) || (r.doctorName || '').toLowerCase().includes(qLower) || (r.id || '').toLowerCase().includes(qLower))
          .slice(0, 3)
      );
    } else {
      setInvoices(allSales.slice(0, 3));
      setPurchases(allPurch.slice(0, 2));
      setPrescriptions(allRx.slice(0, 2));
    }
    setSuppliers(allSups.slice(0, 3));
  };

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    searchAll(val);
  };

  const handleSelectMedicine = (med: Medicine) => {
    setGlobalSearchOpen(false);
    navigate(`/medicines/${med.id}`);
  };

  const handleAddMedToPOS = (e: React.MouseEvent, med: Medicine) => {
    e.stopPropagation();
    addItem(med);
    addToast({
      type: 'success',
      title: 'Added to Cart',
      message: `${med.name} added to POS terminal.`
    });
    setGlobalSearchOpen(false);
    navigate('/pos');
  };

  const handleDispenseRx = (e: React.MouseEvent, rx: Prescription) => {
    e.stopPropagation();
    const patient = customers.find(c => c.id === rx.customerId);
    clearCart();
    if (patient) {
      setCustomer(patient);
    }
    if (rx.doctorName) {
      setDoctorName(rx.doctorName);
    }
    if (rx.items) {
      for (const item of rx.items) {
        const med = medicines.find(m => m.id === item.medicineId || (m.name && item.medicineName && m.name.toLowerCase() === item.medicineName.toLowerCase()));
        if (med) {
          addItem(med, undefined, item.quantity);
        }
      }
    }
    addToast({
      type: 'success',
      title: 'Rx Loaded in POS',
      message: `Prescription loaded into POS terminal for ${rx.customerName || rx.patientName}.`
    });
    setGlobalSearchOpen(false);
    navigate('/pos');
  };

  if (!globalSearchOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-14 sm:pt-20 p-4 overflow-y-auto">
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={() => setGlobalSearchOpen(false)}
      />

      <div className="relative w-full max-w-2xl bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden z-10 flex flex-col max-h-[82vh]">
        {/* Search input header */}
        <div className="flex items-center px-4 py-3 border-b border-slate-200 bg-slate-50/70">
          <Search className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleQueryChange}
            placeholder="Search medicines, generic names, SKU, patients, invoices, prescriptions... [Ctrl+K]"
            className="w-full bg-transparent text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                searchAll('');
              }}
              className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <Kbd className="ml-2 hidden sm:inline-flex text-[9px]">ESC</Kbd>
        </div>

        {/* Categorized results */}
        <div className="p-3.5 overflow-y-auto space-y-4 flex-1">
          {/* Medicines section */}
          {medicines.length > 0 && (
            <div>
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Pill className="w-3.5 h-3.5 text-emerald-600" /> Medicines ({medicines.length})
                </span>
                <span className="text-[10px] font-normal lowercase text-slate-400">click to view or fast-add</span>
              </div>
              <div className="space-y-0.5">
                {medicines.map((med) => (
                  <div
                    key={med.id}
                    onClick={() => handleSelectMedicine(med)}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50 cursor-pointer transition-colors group border border-transparent hover:border-slate-200/60"
                  >
                    <div className="min-w-0 flex-1 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-900 group-hover:text-emerald-700">
                          {med.name}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">({med.strength})</span>
                        {med.prescriptionRequired && <Badge variant="rx" size="sm">Rx</Badge>}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {med.genericName} • <span className="font-mono text-slate-400">{med.sku || med.barcode}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <div className="text-xs font-semibold text-slate-900 font-mono">
                          {formatINR(med.sellingPrice)}
                        </div>
                        <span className={`text-[10px] font-medium ${med.totalStock <= med.reorderLevel ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {med.totalStock} in stock
                        </span>
                      </div>
                      <button
                        onClick={(e) => handleAddMedToPOS(e, med)}
                        title="Add directly to POS billing cart"
                        className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded border border-emerald-200 hover:border-transparent transition-colors text-xs font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <ShoppingCart className="w-3 h-3" />
                        <span className="hidden sm:inline">Add</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prescriptions section */}
          {prescriptions.length > 0 && (
            <div>
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-purple-600" /> Prescriptions ({prescriptions.length})
                </span>
                <span className="text-[10px] font-normal lowercase text-slate-400">1-click dispense</span>
              </div>
              <div className="space-y-0.5">
                {prescriptions.map((rx) => (
                  <div
                    key={rx.id}
                    onClick={() => {
                      setGlobalSearchOpen(false);
                      navigate('/prescriptions');
                    }}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50 cursor-pointer transition-colors border border-transparent hover:border-slate-200/60"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-900">
                        {rx.customerName || rx.patientName} • <span className="font-mono text-slate-500">{rx.id}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {rx.doctorName} ({rx.hospitalClinic}) • {rx.diagnosis}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={rx.status === 'Dispensed' ? 'success' : 'warning'} size="sm">
                        {rx.status}
                      </Badge>
                      <button
                        onClick={(e) => handleDispenseRx(e, rx)}
                        className="px-2 py-1 bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white rounded border border-purple-200 hover:border-transparent transition-colors text-xs font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <ShoppingCart className="w-3 h-3" />
                        <span>Dispense</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customers section */}
          {customers.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-sky-600" /> Patients / Customers ({customers.length})
              </div>
              <div className="space-y-0.5">
                {customers.map((cust) => (
                  <div
                    key={cust.id}
                    onClick={() => {
                      setGlobalSearchOpen(false);
                      navigate(`/customers`);
                    }}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50 cursor-pointer transition-colors border border-transparent hover:border-slate-200/60"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-900">{cust.name}</div>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">{cust.phone} • {cust.city || 'Counter'}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-medium text-slate-600 font-mono">
                        {cust.loyaltyPoints} pts
                      </div>
                      {cust.outstandingBalance > 0 && (
                        <span className="text-[10px] font-semibold text-rose-600 font-mono">
                          Due: {formatINR(cust.outstandingBalance)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invoices section */}
          {invoices.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1.5 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-amber-600" /> Recent Sales Invoices
              </div>
              <div className="space-y-0.5">
                {invoices.map((inv) => (
                  <div
                    key={inv.id}
                    onClick={() => {
                      setGlobalSearchOpen(false);
                      navigate(`/sales`);
                    }}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50 cursor-pointer transition-colors border border-transparent hover:border-slate-200/60"
                  >
                    <div>
                      <div className="text-xs font-semibold font-mono text-slate-900">{inv.invoiceNumber}</div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{inv.customerName} • {inv.items?.length || 0} items</p>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <div className="text-xs font-semibold text-slate-900 font-mono">{formatINR(inv.grandTotal)}</div>
                      <Badge variant="neutral" size="sm">{inv.paymentMethod}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suppliers */}
          {suppliers.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-600" /> Suppliers & Distributors
              </div>
              <div className="space-y-0.5">
                {suppliers.map((sup) => (
                  <div
                    key={sup.id}
                    onClick={() => {
                      setGlobalSearchOpen(false);
                      navigate(`/suppliers`);
                    }}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50 cursor-pointer transition-colors border border-transparent hover:border-slate-200/60"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-900">{sup.name}</div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{sup.contactPerson} • {sup.phone}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-mono text-slate-500">{sup.gstin}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span>Press <Kbd>ESC</Kbd> to dismiss</span>
            <span>Type to search across everything</span>
          </div>
          <button
            onClick={() => {
              setGlobalSearchOpen(false);
              navigate('/medicines');
            }}
            className="text-emerald-700 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
          >
            All Medicines Formulary <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

