import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { salesService } from '../services/salesService';
import { SaleInvoice } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { 
  Search, 
  Eye, 
  Printer, 
  RotateCcw, 
  FileSpreadsheet,
  Receipt
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { formatINR, formatDate, formatTime } from '../utils/formatters';

export const SalesPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useAppStore();

  const [sales, setSales] = useState<SaleInvoice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedInvoice, setSelectedInvoice] = useState<SaleInvoice | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    const list = await salesService.getAll();
    setSales(list);
  };

  const filteredSales = sales.filter((s) => {
    const q = (searchQuery || '').toLowerCase().trim();
    const matchesSearch =
      !q ||
      (s.invoiceNumber || '').toLowerCase().includes(q) ||
      (s.customerName || '').toLowerCase().includes(q) ||
      (s.customerPhone || '').includes(q);

    const matchesMethod = selectedMethod === 'All' || s.paymentMethod === selectedMethod;
    const matchesStatus = selectedStatus === 'All' || s.paymentStatus === selectedStatus;

    return matchesSearch && matchesMethod && matchesStatus;
  });

  const totalSalesAmount = filteredSales.reduce((sum, s) => sum + s.grandTotal, 0);
  const totalTaxCollected = filteredSales.reduce((sum, s) => sum + s.taxTotal, 0);
  const totalDiscountsGiven = filteredSales.reduce((sum, s) => sum + s.discountTotal, 0);

  const handleExportCSV = () => {
    const rows = [
      ['Invoice #', 'Date', 'Customer', 'Phone', 'Doctor', 'Payment Method', 'Subtotal', 'Discount', 'Tax', 'Grand Total'],
      ...filteredSales.map(s => [
        s.invoiceNumber,
        new Date(s.createdAt).toLocaleString(),
        s.customerName,
        s.customerPhone,
        s.doctorName || '',
        s.paymentMethod,
        s.subtotal,
        s.discountTotal,
        s.taxTotal,
        s.grandTotal
      ])
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sales_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast({
      type: 'success',
      title: 'CSV Exported',
      message: 'Sales record exported to CSV.'
    });
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Sales Invoices & Billing History
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit customer transactions, print tax invoices and process item returns
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<FileSpreadsheet className="w-3.5 h-3.5" />}
            onClick={handleExportCSV}
          >
            Export CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Receipt className="w-3.5 h-3.5" />}
            onClick={() => navigate('/pos')}
          >
            New Sale (POS)
          </Button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Filtered Sales Total</span>
          <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
            {formatINR(totalSalesAmount)}
          </div>
          <span className="text-[11px] text-slate-400">{filteredSales.length} Invoices</span>
        </div>

        <div className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">GST Tax (CGST+SGST)</span>
          <div className="text-lg font-bold font-mono text-emerald-700 mt-0.5">
            {formatINR(totalTaxCollected)}
          </div>
          <span className="text-[11px] text-slate-400">Included Tax Breakdown</span>
        </div>

        <div className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Discounts Conceded</span>
          <div className="text-lg font-bold font-mono text-amber-700 mt-0.5">
            {formatINR(totalDiscountsGiven)}
          </div>
          <span className="text-[11px] text-slate-400">Promotions & Loyalty</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3 rounded-xl border border-slate-200 bg-white shadow-2xs flex flex-col md:flex-row gap-2.5">
        <div className="flex-1">
          <Input
            placeholder="Search by invoice #, customer name, mobile number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            className="text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value)}
            className="h-9 px-2.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-900"
          >
            <option value="All">All Payment Modes</option>
            <option value="Cash">Cash</option>
            <option value="UPI/QR">UPI / QR</option>
            <option value="Card">Card</option>
            <option value="Credit">Credit (Khata)</option>
            <option value="Split">Split</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-9 px-2.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-900"
          >
            <option value="All">All Statuses</option>
            <option value="Completed">Completed</option>
            <option value="Pending">Pending</option>
            <option value="Returned">Returned</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3.5 font-semibold">Invoice #</th>
                <th className="py-2.5 px-3.5 font-semibold">Date & Time</th>
                <th className="py-2.5 px-3.5 font-semibold">Patient / Customer</th>
                <th className="py-2.5 px-3.5 font-semibold">Doctor</th>
                <th className="py-2.5 px-3.5 font-semibold">Mode</th>
                <th className="py-2.5 px-3.5 font-semibold">Status</th>
                <th className="py-2.5 px-3.5 font-semibold text-right">Items</th>
                <th className="py-2.5 px-3.5 font-semibold text-right">Grand Total</th>
                <th className="py-2.5 px-3.5 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3.5 font-mono font-semibold text-slate-900">
                    {sale.invoiceNumber}
                  </td>
                  <td className="py-2.5 px-3.5 text-slate-500 font-mono">
                    {formatDate(sale.createdAt)} {formatTime(sale.createdAt)}
                  </td>
                  <td className="py-2.5 px-3.5">
                    <div className="font-semibold text-slate-900">{sale.customerName}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{sale.customerPhone}</div>
                  </td>
                  <td className="py-2.5 px-3.5 text-slate-600">
                    {sale.doctorName || 'Self / OTC'}
                  </td>
                  <td className="py-2.5 px-3.5">
                    <Badge variant="default" size="sm">{sale.paymentMethod}</Badge>
                  </td>
                  <td className="py-2.5 px-3.5">
                    <Badge
                      variant={sale.paymentStatus === 'Completed' ? 'success' : sale.paymentStatus === 'Returned' ? 'danger' : 'warning'}
                      size="sm"
                    >
                      {sale.paymentStatus}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-mono text-slate-600">
                    {sale.items.length}
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-mono font-bold text-slate-900">
                    {formatINR(sale.grandTotal)}
                  </td>
                  <td className="py-2.5 px-3.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="xs"
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                        onClick={() => {
                          setSelectedInvoice(sale);
                          setIsReceiptModalOpen(true);
                        }}
                      >
                        Receipt
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        leftIcon={<RotateCcw className="w-3.5 h-3.5 text-rose-600" />}
                        onClick={() => navigate(`/returns?invoice=${sale.invoiceNumber}`)}
                        title="Initiate Return"
                      >
                        Return
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Receipt Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={isReceiptModalOpen}
          onClose={() => setIsReceiptModalOpen(false)}
          title={`Invoice ${selectedInvoice.invoiceNumber}`}
          description={`Issued to ${selectedInvoice.customerName} on ${formatDate(selectedInvoice.createdAt)}`}
          maxWidth="md"
          footer={
            <div className="flex items-center justify-between w-full">
              <Button variant="outline" size="sm" onClick={() => setIsReceiptModalOpen(false)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Printer className="w-3.5 h-3.5" />}
                onClick={() => window.print()}
              >
                Print Receipt
              </Button>
            </div>
          }
        >
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs space-y-3">
            <div className="text-center border-b border-dashed border-slate-300 pb-3">
              <h3 className="font-bold text-sm text-slate-900">APEX CARE PHARMACY</h3>
              <p className="text-[10px] text-slate-500">MediCentre Galleria, Ring Road, Bengaluru</p>
              <p className="text-[10px] text-slate-500">GSTIN: 29AABCA1234F1Z5</p>
            </div>

            <div className="flex justify-between text-[11px]">
              <div>
                <span>Patient: {selectedInvoice.customerName}</span><br />
                <span>Doctor: {selectedInvoice.doctorName || 'Self / OTC'}</span>
              </div>
              <div className="text-right">
                <span className="font-bold">{selectedInvoice.invoiceNumber}</span><br />
                <span>Mode: {selectedInvoice.paymentMethod}</span>
              </div>
            </div>

            <div className="border-t border-b border-dashed border-slate-300 py-2">
              <div className="flex justify-between font-bold mb-1">
                <span>ITEM (BATCH)</span>
                <span>QTY x RATE</span>
                <span>TOTAL</span>
              </div>
              {selectedInvoice.items.map((item, idx) => (
                <div key={idx} className="flex justify-between py-0.5 text-[11px]">
                  <div className="truncate max-w-[140px]">
                    {item.medicineName} <span className="text-slate-500">({item.batchNumber})</span>
                  </div>
                  <div>{item.quantity} x {formatINR(item.unitPrice)}</div>
                  <div className="font-bold">{formatINR(item.total)}</div>
                </div>
              ))}
            </div>

            <div className="space-y-1 text-right text-[11px]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatINR(selectedInvoice.subtotal)}</span>
              </div>
              {selectedInvoice.discountTotal > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount:</span>
                  <span>-{formatINR(selectedInvoice.discountTotal)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>GST Tax:</span>
                <span>{formatINR(selectedInvoice.taxTotal)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold border-t border-slate-300 pt-1">
                <span>Grand Total:</span>
                <span className="text-emerald-700">{formatINR(selectedInvoice.grandTotal)}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

