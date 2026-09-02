import React, { useState, useEffect } from 'react';
import { Batch } from '../../types';
import { medicineService } from '../../services/medicineService';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { Check, ShieldCheck } from 'lucide-react';
import { formatINR } from '../../utils/formatters';

interface BatchSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  medicineId: string;
  medicineName: string;
  currentBatchId?: string;
  onSelectBatch: (batch: Batch) => void;
}

export const BatchSelectorModal: React.FC<BatchSelectorModalProps> = ({
  isOpen,
  onClose,
  medicineId,
  medicineName,
  currentBatchId,
  onSelectBatch
}) => {
  const [batches, setBatches] = useState<Batch[]>([]);

  useEffect(() => {
    if (isOpen && medicineId) {
      loadMedicineBatches();
    }
  }, [isOpen, medicineId]);

  const loadMedicineBatches = async () => {
    const med = await medicineService.getById(medicineId);
    if (med) {
      // Sort batches by expiry date (FEFO)
      const sorted = [...med.batches].sort(
        (a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
      );
      setBatches(sorted);
    }
  };

  const isBatchNearExpiry = (expiryDate: string) => {
    const days = (new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
    return days <= 90 && days > 0;
  };

  const isBatchExpired = (expiryDate: string) => {
    return new Date(expiryDate).getTime() < new Date().getTime();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Select Medicine Batch (FEFO Compliant)"
      description={`Available inventory batches for ${medicineName}`}
      maxWidth="md"
    >
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>First-Expiry, First-Out (FEFO) rule auto-prioritizes earliest valid expiring batches.</span>
        </div>

        <div className="space-y-2">
          {batches.map((batch, index) => {
            const isSelected = batch.id === currentBatchId;
            const expired = isBatchExpired(batch.expiryDate);
            const nearExpiry = isBatchNearExpiry(batch.expiryDate);

            return (
              <div
                key={batch.id}
                onClick={() => {
                  if (batch.quantity > 0 && !expired) {
                    onSelectBatch(batch);
                    onClose();
                  }
                }}
                className={`p-3 rounded-lg border flex items-center justify-between transition-colors ${
                  expired || batch.quantity === 0
                    ? 'opacity-50 bg-slate-50 border-slate-200 cursor-not-allowed'
                    : isSelected
                    ? 'border-emerald-600 bg-emerald-50/50 cursor-pointer'
                    : 'border-slate-200 hover:border-slate-300 bg-white cursor-pointer'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-slate-900">
                      {batch.batchNumber}
                    </span>
                    {index === 0 && !expired && batch.quantity > 0 && (
                      <Badge variant="success" size="sm">Recommended FEFO</Badge>
                    )}
                    {expired && <Badge variant="danger" size="sm">Expired</Badge>}
                    {nearExpiry && !expired && <Badge variant="warning" size="sm">Near Expiry</Badge>}
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                    <span>Exp: {batch.expiryDate}</span>
                    <span>•</span>
                    <span>Rack: {batch.rackLocation || 'A-01'}</span>
                    <span>•</span>
                    <span>MRP: {formatINR(batch.mrp)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-xs font-bold font-mono text-slate-900">
                      {formatINR(batch.sellingPrice)}
                    </div>
                    <span className={`text-[11px] font-semibold ${batch.quantity <= 10 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {batch.quantity} units left
                    </span>
                  </div>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};

