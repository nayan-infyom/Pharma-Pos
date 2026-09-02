import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { Modal } from '../ui/Modal';
import { 
  ShoppingCart, 
  PlusCircle, 
  UserPlus, 
  FileText, 
  RotateCcw, 
  DollarSign, 
  SlidersHorizontal,
  PackagePlus,
  Zap
} from 'lucide-react';

export const QuickActionModal: React.FC = () => {
  const { quickActionOpen, setQuickActionOpen } = useAppStore();
  const navigate = useNavigate();

  const actions = [
    {
      title: 'New POS Sale',
      desc: 'Open cashier counter and start billing',
      icon: <ShoppingCart className="w-4 h-4 text-emerald-600" />,
      action: () => navigate('/pos')
    },
    {
      title: 'Add Medicine Master',
      desc: 'Register drug formulary, SKU and pricing',
      icon: <PlusCircle className="w-4 h-4 text-emerald-700" />,
      action: () => navigate('/medicines?action=new')
    },
    {
      title: 'New Purchase Order',
      desc: 'Inward incoming shipment and new batches',
      icon: <PackagePlus className="w-4 h-4 text-sky-600" />,
      action: () => navigate('/purchases?action=new')
    },
    {
      title: 'Record Patient / Customer',
      desc: 'Create profile, chronic conditions & credit limit',
      icon: <UserPlus className="w-4 h-4 text-indigo-600" />,
      action: () => navigate('/customers?action=new')
    },
    {
      title: 'Dispense Prescription',
      desc: 'Process digital Rx and convert to cart',
      icon: <FileText className="w-4 h-4 text-amber-600" />,
      action: () => navigate('/prescriptions?action=new')
    },
    {
      title: 'Process Return Voucher',
      desc: 'Customer refund or supplier batch return',
      icon: <RotateCcw className="w-4 h-4 text-rose-600" />,
      action: () => navigate('/returns')
    },
    {
      title: 'Record Operating Expense',
      desc: 'Store utilities, logistics or equipment maintenance',
      icon: <DollarSign className="w-4 h-4 text-amber-700" />,
      action: () => navigate('/expenses?action=new')
    },
    {
      title: 'Stock Adjustment & Audit',
      desc: 'Quantity reconciliation or damage write-off',
      icon: <SlidersHorizontal className="w-4 h-4 text-slate-700" />,
      action: () => navigate('/inventory?action=adjust')
    }
  ];

  const handleRun = (act: () => void) => {
    setQuickActionOpen(false);
    act();
  };

  return (
    <Modal
      isOpen={quickActionOpen}
      onClose={() => setQuickActionOpen(false)}
      title={
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald-600" />
          <span>Quick Actions</span>
        </div>
      }
      description="Quick access to common pharmacy workflows"
      maxWidth="lg"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {actions.map((act, i) => (
          <button
            key={i}
            onClick={() => handleRun(act.action)}
            className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80 text-left transition-colors cursor-pointer group"
          >
            <div className="p-2 rounded-md bg-slate-100 group-hover:bg-white group-hover:shadow-xs transition-colors shrink-0">
              {act.icon}
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-900 group-hover:text-emerald-700">
                {act.title}
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                {act.desc}
              </p>
            </div>
          </button>
        ))}
      </div>
    </Modal>
  );
};

