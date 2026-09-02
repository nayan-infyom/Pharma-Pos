import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { GlobalSearchModal } from './GlobalSearchModal';
import { QuickActionModal } from './QuickActionModal';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';
import { ToastContainer } from './ToastContainer';
import { usePOSStore } from '../../store/usePOSStore';

export const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const { openPayment, holdSale, isPaymentOpen } = usePOSStore();

  // Global POS hotkeys listener: F2 (POS), F6 (Payment), F8 (Hold), Alt+P (POS)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        navigate('/pos');
      } else if (e.key === 'F6' && window.location.pathname === '/pos') {
        e.preventDefault();
        openPayment();
      } else if (e.key === 'F8' && window.location.pathname === '/pos') {
        e.preventDefault();
        holdSale();
      } else if (e.altKey && e.key && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        navigate('/pos');
      } else if (e.altKey && e.key && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        navigate('/inventory');
      } else if (e.altKey && e.key && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        navigate('/medicines');
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [navigate, openPayment, holdSale, isPaymentOpen]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
      <div className="flex flex-1 min-h-screen">
        <Sidebar />

        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />

          <main className="flex-1 p-4 sm:p-5 lg:p-6 overflow-y-auto max-w-[1600px] w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Modals and Overlays */}
      <GlobalSearchModal />
      <QuickActionModal />
      <KeyboardShortcutsModal />
      <ToastContainer />
    </div>
  );
};

