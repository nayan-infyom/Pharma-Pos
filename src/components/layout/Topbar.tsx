import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import {
  Search,
  Bell,
  Menu,
  Building,
  Keyboard,
  CheckCircle,
  AlertTriangle,
  Clock,
  ChevronDown,
  ShoppingCart
} from 'lucide-react';
import { Kbd } from '../ui/Kbd';
import { Badge } from '../ui/Badge';
import { initialEmployees } from '../../data/employees';

export const Topbar: React.FC = () => {
  const {
    setMobileSidebarOpen,
    setGlobalSearchOpen,
    setShortcutsModalOpen,
    currentStore,
    setCurrentStore,
    currentUser,
    setCurrentUser
  } = useAppStore();

  const location = useLocation();
  const navigate = useNavigate();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [storeMenuOpen, setStoreMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const notificationsRef = useRef<HTMLDivElement>(null);
  const storeRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
      if (storeRef.current && !storeRef.current.contains(event.target as Node)) {
        setStoreMenuOpen(false);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getBreadcrumbs = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path.startsWith('/pos')) return 'POS Terminal';
    if (path.startsWith('/sales')) return 'Sales & Invoices';
    if (path.startsWith('/purchases')) return 'Purchases & Inward';
    if (path.startsWith('/inventory')) return 'Inventory & Batches';
    if (path.startsWith('/medicines')) return 'Medicine Formulary';
    if (path.startsWith('/customers')) return 'Customers & Khata';
    if (path.startsWith('/suppliers')) return 'Suppliers & Vendors';
    if (path.startsWith('/prescriptions')) return 'Prescription Dispenser';
    if (path.startsWith('/returns')) return 'Return Vouchers';
    if (path.startsWith('/expenses')) return 'Operating Expenses';
    if (path.startsWith('/reports')) return 'Reports & Analytics';
    if (path.startsWith('/employees')) return 'Staff & Access Roles';
    if (path.startsWith('/settings')) return 'Store Configuration';
    return 'PharmaPOS';
  };

  const urgentAlerts = [
    {
      id: 'alt-1',
      title: '3 medicines out of stock',
      desc: 'Ciplox 500, ORS Sachet, and Glycomet-GP2 require re-order',
      type: 'danger',
      time: '10m ago',
      link: '/inventory'
    },
    {
      id: 'alt-2',
      title: '2 batches expire within 30 days',
      desc: 'Augmentin 625 (AUG23J04) & Pantocid 40 require FEFO clearance',
      type: 'warning',
      time: '1h ago',
      link: '/inventory'
    },
    {
      id: 'alt-3',
      title: '4 supplier payments due',
      desc: 'Apollo Wholesale & MedLife invoices scheduled this week',
      type: 'info',
      time: '3h ago',
      link: '/suppliers'
    }
  ];

  const stores = [
    'Apex Care - Main Branch',
    'Apex Care - Metro Hospital Branch',
    'Apex Care - Airport Outpost'
  ];

  return (
    <header className="h-14 border-b border-slate-200 bg-white sticky top-0 z-20 px-4 sm:px-5 flex items-center justify-between gap-3 select-none">
      {/* Left: Mobile Toggle & Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(true)}
          className="lg:hidden p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md cursor-pointer"
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1.5 text-xs font-medium min-w-0">
          <span className="text-slate-400 hidden sm:inline">Pharma</span>
          <span className="text-slate-300 hidden sm:inline">/</span>
          <span className="text-slate-900 font-semibold truncate text-sm">
            {getBreadcrumbs()}
          </span>
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <div className="flex-1 max-w-sm hidden md:block">
        <button
          type="button"
          onClick={() => setGlobalSearchOpen(true)}
          className="w-full flex items-center justify-between px-3 py-1.5 bg-slate-50 hover:bg-slate-100/90 text-slate-400 rounded-md text-xs transition-colors cursor-pointer border border-slate-200"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">Search medicines, patients, bills...</span>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            <Kbd className="text-[9px] py-0.2 px-1">⌘K</Kbd>
          </div>
        </button>
      </div>

      {/* Right: Actions, Store Selector, Alerts, Profile */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Quick Search on Mobile */}
        <button
          type="button"
          onClick={() => setGlobalSearchOpen(true)}
          className="md:hidden p-1.5 text-slate-600 hover:bg-slate-100 rounded-md cursor-pointer"
          title="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Primary POS Action Button */}
        <button
          type="button"
          onClick={() => navigate('/pos')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-md text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>New Sale</span>
        </button>

        {/* Keyboard Shortcuts Trigger */}
        <button
          type="button"
          onClick={() => setShortcutsModalOpen(true)}
          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer hidden sm:flex"
          title="Keyboard shortcuts (F2, F6, F8)"
        >
          <Keyboard className="w-4 h-4" />
        </button>

        {/* Store Branch Selector */}
        <div className="relative" ref={storeRef}>
          <button
            type="button"
            onClick={() => setStoreMenuOpen(!storeMenuOpen)}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 rounded-md transition-colors cursor-pointer border border-slate-200"
          >
            <Building className="w-3.5 h-3.5 text-emerald-600" />
            <span className="max-w-[100px] truncate">{currentStore.split(' - ')[1] || currentStore}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {storeMenuOpen && (
            <div className="absolute right-0 mt-1 w-56 bg-white rounded-md border border-slate-200 shadow-lg py-1 z-40">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Store Location
              </div>
              {stores.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setCurrentStore(s);
                    setStoreMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                    currentStore === s ? 'text-emerald-700 font-semibold bg-emerald-50/60' : 'text-slate-700'
                  }`}
                >
                  <span className="truncate">{s}</span>
                  {currentStore === s && <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-2" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Operational Alerts Popover */}
        <div className="relative" ref={notificationsRef}>
          <button
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
            title="Operational Alerts"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-1 w-80 sm:w-84 bg-white rounded-lg border border-slate-200 shadow-xl overflow-hidden z-40">
              <div className="px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-900">Attention Required</span>
                  <Badge variant="danger" size="sm">3</Badge>
                </div>
                <button
                  onClick={() => setNotificationsOpen(false)}
                  className="text-[11px] text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Close
                </button>
              </div>

              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {urgentAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    onClick={() => {
                      setNotificationsOpen(false);
                      navigate(alert.link);
                    }}
                    className="p-3 hover:bg-slate-50/80 cursor-pointer transition-colors flex items-start gap-2.5"
                  >
                    <div className="mt-0.5 shrink-0">
                      {alert.type === 'danger' ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      ) : alert.type === 'warning' ? (
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                      ) : (
                        <Building className="w-3.5 h-3.5 text-sky-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs font-semibold text-slate-900 flex items-center justify-between">
                        <span>{alert.title}</span>
                        <span className="text-[10px] text-slate-400 font-normal">{alert.time}</span>
                      </h5>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        {alert.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-2 bg-slate-50 border-t border-slate-100 text-center">
                <button
                  onClick={() => {
                    setNotificationsOpen(false);
                    navigate('/inventory');
                  }}
                  className="text-xs font-medium text-emerald-700 hover:text-emerald-800 cursor-pointer"
                >
                  View Inventory Radar →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile & Staff Role Switcher */}
        <div className="relative" ref={userRef}>
          <button
            type="button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-1.5 p-1 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
          >
            <div className="w-6.5 h-6.5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px] font-bold">
              {currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-1 w-52 bg-white rounded-md border border-slate-200 shadow-lg py-1 z-40">
              <div className="px-3 py-2 border-b border-slate-100">
                <div className="text-xs font-bold text-slate-900">{currentUser.name}</div>
                <div className="text-[11px] text-slate-500">{currentUser.role}</div>
              </div>

              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                Switch Staff Role
              </div>
              {initialEmployees.map((emp) => (
                <button
                  key={emp.id}
                  onClick={() => {
                    setCurrentUser(emp);
                    setUserMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                    currentUser.id === emp.id ? 'text-emerald-700 font-semibold bg-emerald-50/60' : 'text-slate-700'
                  }`}
                >
                  <div>
                    <div>{emp.name}</div>
                    <div className="text-[10px] text-slate-400">{emp.role}</div>
                  </div>
                  {currentUser.id === emp.id && <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                </button>
              ))}

              <div className="border-t border-slate-100 mt-1 pt-1">
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    navigate('/settings');
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Settings & Configurations
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

