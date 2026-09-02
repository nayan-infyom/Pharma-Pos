import React from 'react';
import { usePOSStore } from '../../store/usePOSStore';
import { Drawer } from '../ui/Drawer';
import { Button } from '../ui/Button';
import { ShoppingCart, Play, Trash2, Clock, User } from 'lucide-react';
import { EmptyState } from '../ui/EmptyState';
import { formatINR } from '../../utils/formatters';

export const HeldSalesDrawer: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose
}) => {
  const { heldSales, resumeSale, deleteHeldSale } = usePOSStore();

  const handleResume = (id: string) => {
    resumeSale(id);
    onClose();
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-600" />
          <span>Held Carts ({heldSales.length})</span>
        </div>
      }
      description="Recall paused customer transactions to resume billing (F9)"
      width="md"
    >
      {heldSales.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart className="w-8 h-8 text-slate-400" />}
          title="No Held Transactions"
          description="Press F8 at the POS counter to pause and hold active carts."
        />
      ) : (
        <div className="space-y-2.5">
          {heldSales.map((sale) => (
            <div
              key={sale.id}
              className="p-3 rounded-lg border border-slate-200 bg-white space-y-2.5 shadow-2xs"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    {sale.customer?.name || 'Walk-in Customer'}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                    <span>Held at {sale.heldAt}</span>
                    <span>•</span>
                    <span>{sale.items.length} items</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold font-mono text-slate-900">
                    {formatINR(sale.grandTotal)}
                  </span>
                </div>
              </div>

              {/* Item chips preview */}
              <div className="flex flex-wrap gap-1">
                {sale.items.map((item, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 truncate max-w-[140px] font-medium"
                  >
                    {item.quantity}x {item.medicineName}
                  </span>
                ))}
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <Button
                  variant="ghost"
                  size="xs"
                  className="text-rose-600 hover:text-rose-700"
                  leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                  onClick={() => deleteHeldSale(sale.id)}
                >
                  Discard
                </Button>

                <Button
                  variant="primary"
                  size="xs"
                  leftIcon={<Play className="w-3.5 h-3.5 fill-current" />}
                  onClick={() => handleResume(sale.id)}
                >
                  Resume Billing
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Drawer>
  );
};

