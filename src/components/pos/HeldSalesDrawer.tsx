import React, { useState } from 'react';
import { usePOSStore } from '../../store/usePOSStore';
import { useAppStore } from '../../store/useAppStore';
import { Drawer } from '../ui/Drawer';
import { Button } from '../ui/Button';
import { ShoppingCart, Play, Trash2, Clock, User, Loader2 } from 'lucide-react';
import { EmptyState } from '../ui/EmptyState';
import { formatINR, formatTime } from '../../utils/formatters';

export const HeldSalesDrawer: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose
}) => {
  const { heldSales, isHeldSalesLoading, resumeSale, deleteHeldSale } = usePOSStore();
  const { addToast } = useAppStore();
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleResume = async (id: string) => {
    if (busyId) return;
    setBusyId(id);
    try {
      await resumeSale(id);
      onClose();
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Could Not Resume Cart',
        message: err instanceof Error ? err.message : 'Failed to resume this held cart.'
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleDiscard = async (id: string) => {
    if (busyId) return;
    setBusyId(id);
    try {
      await deleteHeldSale(id);
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Could Not Discard Cart',
        message: err instanceof Error ? err.message : 'Failed to discard this held cart.'
      });
    } finally {
      setBusyId(null);
    }
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
      {isHeldSalesLoading ? (
        <div className="p-8 flex justify-center text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : heldSales.length === 0 ? (
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
                    <span>Held at {formatTime(sale.heldAt)}</span>
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
                  leftIcon={busyId === sale.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  disabled={busyId !== null}
                  onClick={() => handleDiscard(sale.id)}
                >
                  Discard
                </Button>

                <Button
                  variant="primary"
                  size="xs"
                  leftIcon={<Play className="w-3.5 h-3.5 fill-current" />}
                  isLoading={busyId === sale.id}
                  disabled={busyId !== null}
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
