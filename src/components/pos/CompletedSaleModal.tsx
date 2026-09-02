import React, { useState } from 'react';
import { usePOSStore } from '../../store/usePOSStore';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Tabs } from '../ui/Tabs';
import { 
  Printer, 
  CheckCircle, 
  Download, 
  PlusCircle, 
  FileText, 
  Receipt as ReceiptIcon
} from 'lucide-react';
import { formatINR, formatDate, formatTime } from '../../utils/formatters';

export const CompletedSaleModal: React.FC = () => {
  const {
    lastCompletedSale,
    isCompletedModalOpen,
    setIsCompletedModalOpen,
    setLastCompletedSale
  } = usePOSStore();

  const [receiptType, setReceiptType] = useState<'thermal' | 'a4'>('thermal');

  if (!isCompletedModalOpen || !lastCompletedSale) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleClose = () => {
    setIsCompletedModalOpen(false);
    setLastCompletedSale(null);
  };

  return (
    <Modal
      isOpen={isCompletedModalOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          <span>Sale Completed • {lastCompletedSale.invoiceNumber}</span>
        </div>
      }
      description={`Timestamp: ${formatDate(lastCompletedSale.date || lastCompletedSale.createdAt)}, ${formatTime(lastCompletedSale.date || lastCompletedSale.createdAt)}`}
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<PlusCircle className="w-4 h-4" />}
            onClick={handleClose}
          >
            Start Next Sale (F2)
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Download className="w-4 h-4" />}
              onClick={() => window.print()}
            >
              Export PDF
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Printer className="w-4 h-4" />}
              onClick={handlePrint}
            >
              Print Receipt
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Receipt format switcher */}
        <div className="flex items-center justify-between">
          <Tabs
            variant="pills"
            activeTab={receiptType}
            onChange={(tab) => setReceiptType(tab as 'thermal' | 'a4')}
            tabs={[
              { id: 'thermal', label: '80mm Thermal Slip', icon: <ReceiptIcon className="w-3.5 h-3.5" /> },
              { id: 'a4', label: 'Full A4 GST Tax Invoice', icon: <FileText className="w-3.5 h-3.5" /> }
            ]}
          />
          <Badge variant="success" size="sm">Paid • {lastCompletedSale.paymentMethod}</Badge>
        </div>

        {/* 80mm Thermal Slip View */}
        {receiptType === 'thermal' && (
          <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs max-w-sm mx-auto space-y-3 print:border-none print:shadow-none">
            <div className="text-center border-b border-dashed border-slate-300 pb-3">
              <h3 className="font-bold text-sm tracking-tight text-slate-900">APEX CARE PHARMACY</h3>
              <p className="text-[10px] text-slate-500">MediCentre Galleria, Ring Road, Bengaluru</p>
              <p className="text-[10px] text-slate-500">Ph: +91 80 4455 6677 • DL: 20B/21B-88392</p>
              <p className="text-[10px] text-slate-700 font-semibold">GSTIN: 29AABCA1234F1Z5</p>
            </div>

            <div className="flex justify-between text-[10px]">
              <div>
                <span>Patient: {lastCompletedSale.customerName}</span><br />
                <span>Doctor: {lastCompletedSale.doctorName || 'Self / OTC'}</span>
              </div>
              <div className="text-right">
                <span className="font-bold">{lastCompletedSale.invoiceNumber}</span><br />
                <span>Cashier: {lastCompletedSale.cashierName}</span>
              </div>
            </div>

            <div className="border-t border-b border-dashed border-slate-300 py-2">
              <div className="flex justify-between font-bold text-[10px] mb-1">
                <span>ITEM (BATCH)</span>
                <span>QTY x RATE</span>
                <span>TOTAL</span>
              </div>
              {lastCompletedSale.items.map((item, idx) => (
                <div key={idx} className="flex justify-between py-0.5 text-[10px]">
                  <div className="truncate max-w-[130px]">
                    {item.medicineName} <span className="text-slate-500 font-normal">({item.batchNumber})</span>
                  </div>
                  <div>{item.quantity} x {formatINR(item.unitPrice)}</div>
                  <div className="font-bold">{formatINR(item.total)}</div>
                </div>
              ))}
            </div>

            <div className="space-y-1 text-right text-[10px]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatINR(lastCompletedSale.subtotal)}</span>
              </div>
              {lastCompletedSale.discountTotal > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount:</span>
                  <span>-{formatINR(lastCompletedSale.discountTotal)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>GST Tax (CGST+SGST):</span>
                <span>{formatINR(lastCompletedSale.taxTotal)}</span>
              </div>
              {lastCompletedSale.roundOff !== 0 && (
                <div className="flex justify-between">
                  <span>Round Off:</span>
                  <span>{lastCompletedSale.roundOff > 0 ? `+${lastCompletedSale.roundOff}` : lastCompletedSale.roundOff}</span>
                </div>
              )}
              <div className="flex justify-between text-xs font-bold border-t border-slate-300 pt-1">
                <span>GRAND TOTAL:</span>
                <span className="text-emerald-700">{formatINR(lastCompletedSale.grandTotal)}</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Paid via {lastCompletedSale.paymentMethod}:</span>
                <span>{formatINR(lastCompletedSale.amountPaid)}</span>
              </div>
              {(lastCompletedSale.changeDue > 0 || (lastCompletedSale.changeReturned && lastCompletedSale.changeReturned > 0)) && (
                <div className="flex justify-between font-bold text-emerald-700">
                  <span>Change Returned:</span>
                  <span>{formatINR(lastCompletedSale.changeDue || lastCompletedSale.changeReturned || 0)}</span>
                </div>
              )}
            </div>

            <div className="text-center text-[10px] text-slate-500 pt-2 border-t border-dashed border-slate-300">
              * Schedule H & H1 drugs sold against valid prescription only.<br />
              Thank you for choosing Apex Care!
            </div>
          </div>
        )}

        {/* Full A4 GST Tax Invoice View */}
        {receiptType === 'a4' && (
          <div className="p-5 bg-white rounded-xl border border-slate-200 text-xs space-y-4">
            <div className="flex justify-between items-start border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">APEX CARE PHARMACY</h2>
                <p className="text-slate-500 text-[11px]">MediCentre Galleria, Ring Road, Bengaluru, Karnataka 560001</p>
                <p className="text-slate-500 text-[11px]">GSTIN: 29AABCA1234F1Z5 • Drug License: KA-BLR-20B-88392</p>
              </div>
              <div className="text-right">
                <Badge variant="success" size="sm">TAX INVOICE</Badge>
                <div className="font-mono font-bold text-sm text-slate-900 mt-1">
                  {lastCompletedSale.invoiceNumber}
                </div>
                <div className="text-[11px] text-slate-500">{formatDate(lastCompletedSale.date || lastCompletedSale.createdAt)}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <span className="font-bold text-slate-700 block">Patient / Customer:</span>
                <span className="text-slate-900 font-semibold">{lastCompletedSale.customerName}</span>
                <p className="text-slate-500 font-mono text-[11px]">{lastCompletedSale.customerPhone}</p>
              </div>
              <div>
                <span className="font-bold text-slate-700 block">Prescribing Physician:</span>
                <span className="text-slate-900">{lastCompletedSale.doctorName || 'Self / OTC'}</span>
                <p className="text-slate-500 text-[11px]">Dispensed by: {lastCompletedSale.cashierName}</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 font-semibold text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-2.5">Medicine Description</th>
                    <th className="py-2 px-2.5">Batch</th>
                    <th className="py-2 px-2.5">Expiry</th>
                    <th className="py-2 px-2.5 text-right">Qty</th>
                    <th className="py-2 px-2.5 text-right">MRP</th>
                    <th className="py-2 px-2.5 text-right">Rate</th>
                    <th className="py-2 px-2.5 text-right">GST %</th>
                    <th className="py-2 px-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lastCompletedSale.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-2.5 font-medium text-slate-900">
                        {item.medicineName}
                      </td>
                      <td className="py-2 px-2.5 font-mono text-slate-500">{item.batchNumber}</td>
                      <td className="py-2 px-2.5 font-mono text-slate-500">{item.expiryDate}</td>
                      <td className="py-2 px-2.5 text-right font-bold">{item.quantity}</td>
                      <td className="py-2 px-2.5 text-right font-mono">{formatINR(item.mrp)}</td>
                      <td className="py-2 px-2.5 text-right font-mono">{formatINR(item.unitPrice)}</td>
                      <td className="py-2 px-2.5 text-right">{item.taxRate}%</td>
                      <td className="py-2 px-2.5 text-right font-bold font-mono">{formatINR(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200">
              <div className="w-64 space-y-1 text-xs text-right">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono font-semibold">{formatINR(lastCompletedSale.subtotal)}</span>
                </div>
                {lastCompletedSale.discountTotal > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount:</span>
                    <span className="font-mono font-semibold">-{formatINR(lastCompletedSale.discountTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Total GST:</span>
                  <span className="font-mono font-semibold">{formatINR(lastCompletedSale.taxTotal)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-slate-200 pt-1">
                  <span>Net Payable:</span>
                  <span className="font-mono text-emerald-700">{formatINR(lastCompletedSale.grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

