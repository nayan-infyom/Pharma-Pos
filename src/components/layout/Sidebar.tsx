import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Truck,
  Boxes,
  Pill,
  Users,
  Building2,
  FileText,
  RotateCcw,
  ReceiptText,
  BarChart3,
  UserCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus
} from 'lucide-react';

interface NavSection {
  title: string;
  items: {
    name: string;
    path: string;
    icon: React.ReactNode;
    badge?: string | number;
    badgeVariant?: 'live' | 'warning' | 'info';
  }[];
}

export const Sidebar: React.FC = () => {
  const {
    sidebarCollapsed,
    toggleSidebar,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    currentUser
  } = useAppStore();
  const location = useLocation();

  const navSections: NavSection[] = [
    {
      title: 'OVERVIEW',
      items: [
        { name: 'Dashboard', path: '/', icon: <LayoutDashboard className="w-4 h-4" /> }
      ]
    },
    {
      title: 'OPERATIONS',
      items: [
        { name: 'POS', path: '/pos', icon: <ShoppingCart className="w-4 h-4" />, badge: 'LIVE', badgeVariant: 'live' },
        { name: 'Sales', path: '/sales', icon: <Receipt className="w-4 h-4" /> },
        { name: 'Purchases', path: '/purchases', icon: <Truck className="w-4 h-4" /> },
        { name: 'Inventory', path: '/inventory', icon: <Boxes className="w-4 h-4" />, badge: '8', badgeVariant: 'warning' }
      ]
    },
    {
      title: 'CATALOG',
      items: [
        { name: 'Medicines', path: '/medicines', icon: <Pill className="w-4 h-4" /> }
      ]
    },
    {
      title: 'PEOPLE',
      items: [
        { name: 'Customers', path: '/customers', icon: <Users className="w-4 h-4" /> },
        { name: 'Suppliers', path: '/suppliers', icon: <Building2 className="w-4 h-4" /> },
        { name: 'Prescriptions', path: '/prescriptions', icon: <FileText className="w-4 h-4" />, badge: '2', badgeVariant: 'info' }
      ]
    },
    {
      title: 'FINANCE',
      items: [
        { name: 'Expenses', path: '/expenses', icon: <ReceiptText className="w-4 h-4" /> },
        { name: 'Reports', path: '/reports', icon: <BarChart3 className="w-4 h-4" /> },
        { name: 'Returns', path: '/returns', icon: <RotateCcw className="w-4 h-4" /> }
      ]
    },
    {
      title: 'ADMINISTRATION',
      items: [
        { name: 'Staff & Roles', path: '/employees', icon: <UserCheck className="w-4 h-4" /> },
        { name: 'Settings', path: '/settings', icon: <Settings className="w-4 h-4" /> }
      ]
    }
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 select-none">
      {/* Brand Header */}
      <div className="h-14 px-3.5 flex items-center justify-between border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-7 h-7 rounded-md bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-xs">
            <Plus className="w-4 h-4 stroke-[3]" />
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-bold text-sm tracking-tight text-slate-900">
                  PHARMA<span className="text-emerald-600 font-extrabold">POS</span>
                </span>
                <span className="text-[9px] font-semibold px-1 py-0.2 rounded bg-slate-100 text-slate-600 font-mono border border-slate-200">
                  PRO
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">Apex Pharmacy Suite</p>
            </div>
          )}
        </div>

        {/* Collapse toggle (Desktop only) */}
        <button
          type="button"
          onClick={toggleSidebar}
          className="hidden lg:flex p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto py-2.5 px-2 space-y-3.5">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-0.5">
            {!sidebarCollapsed ? (
              <div className="px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                {section.title}
              </div>
            ) : (
              <div className="h-px bg-slate-100 my-1.5 mx-1" />
            )}

            {section.items.map((item) => {
              const isDashboard = item.path === '/';
              const isActive = isDashboard 
                ? location.pathname === '/' 
                : location.pathname === item.path || location.pathname.startsWith(item.path + '/');

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileSidebarOpen(false)}
                  className={`group relative flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors duration-100 cursor-pointer ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  } ${sidebarCollapsed ? 'justify-center px-1.5' : ''}`}
                  title={sidebarCollapsed ? item.name : undefined}
                >
                  <span
                    className={`shrink-0 transition-colors ${
                      isActive
                        ? 'text-emerald-600'
                        : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  >
                    {item.icon}
                  </span>

                  {!sidebarCollapsed && (
                    <span className="truncate flex-1">{item.name}</span>
                  )}

                  {!sidebarCollapsed && item.badge !== undefined && (
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                        item.badgeVariant === 'live'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.badgeVariant === 'warning'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}

                  {/* Tooltip on collapsed state */}
                  {sidebarCollapsed && (
                    <div className="fixed left-16 z-50 hidden group-hover:flex items-center px-2 py-1 text-xs font-semibold text-white bg-slate-900 rounded shadow-md pointer-events-none whitespace-nowrap">
                      {item.name}
                      {item.badge !== undefined && (
                        <span className="ml-1.5 text-[10px] opacity-80">({item.badge})</span>
                      )}
                    </div>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </div>

      {/* Staff active status footer */}
      <div className="p-2.5 border-t border-slate-100 shrink-0 bg-slate-50/60">
        <div className={`flex items-center gap-2 ${sidebarCollapsed ? 'justify-center' : ''}`}>
          <div className="w-6.5 h-6.5 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-200">
            {currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-slate-800 truncate">
                {currentUser.name}
              </div>
              <p className="text-[10px] text-slate-400 truncate">{currentUser.role}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 transition-all duration-150 h-screen sticky top-0 z-30 ${
          sidebarCollapsed ? 'w-14' : 'w-52'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Sidebar */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-56 max-w-[80vw] z-10 animate-in slide-in-from-left duration-150">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

