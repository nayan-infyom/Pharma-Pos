import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { medicineService } from '../services/medicineService';
import { inventoryService } from '../services/inventoryService';
import { Medicine, StockMovement, ExpiryRadarItem } from '../types';
import { ApiError, Pagination as PaginationMeta } from '../api/client';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Tabs } from '../components/ui/Tabs';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import {
  SlidersHorizontal,
  Search,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { formatINR, formatDate, formatTime } from '../utils/formatters';

const PAGE_SIZE = 25;

export const InventoryPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useAppStore();

  const [activeTab, setActiveTab] = useState<'batches' | 'expiring' | 'lowstock' | 'movements'>('batches');

  // "All Batches" tab — capped-at-100 medicine list, same documented
  // limitation as medicineService elsewhere; also feeds the adjustment
  // modal's medicine/batch pickers and the valuation stat cards.
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [isMedicinesLoading, setIsMedicinesLoading] = useState(true);
  const [batchSearch, setBatchSearch] = useState('');
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // "Near Expiry" tab — server-aggregated radar, replaces the old client-side full-scan.
  const [expiryItems, setExpiryItems] = useState<ExpiryRadarItem[]>([]);
  const [expiryPagination, setExpiryPagination] = useState<PaginationMeta | null>(null);
  const [expiryPage, setExpiryPage] = useState(1);
  const [isExpiryLoading, setIsExpiryLoading] = useState(true);

  // "Shortage & Reorders" tab
  const [lowStockItems, setLowStockItems] = useState<Medicine[]>([]);
  const [lowStockPagination, setLowStockPagination] = useState<PaginationMeta | null>(null);
  const [lowStockPage, setLowStockPage] = useState(1);
  const [isLowStockLoading, setIsLowStockLoading] = useState(true);

  // "Audit Trail" tab
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [movementsPagination, setMovementsPagination] = useState<PaginationMeta | null>(null);
  const [movementsPage, setMovementsPage] = useState(1);
  const [isMovementsLoading, setIsMovementsLoading] = useState(true);

  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);

  // Adjustment modal form
  const [adjMedId, setAdjMedId] = useState('');
  const [adjBatchId, setAdjBatchId] = useState('');
  const [adjType, setAdjType] = useState<'Add Stock' | 'Subtract Stock' | 'Mark Damaged' | 'Mark Expired' | 'Set Stock (Audit)'>('Subtract Stock');
  const [adjQty, setAdjQty] = useState('5');
  const [adjReason, setAdjReason] = useState('Damaged during storage handling');
  const [adjNotes, setAdjNotes] = useState('');

  const loadMedicines = async (search?: string) => {
    setIsMedicinesLoading(true);
    try {
      const list = search ? await medicineService.search(search) : await medicineService.getAll();
      setMedicines(list);
      if (list.length > 0 && !adjMedId) {
        setAdjMedId(list[0].id);
        if (list[0].batches.length > 0) setAdjBatchId(list[0].batches[0].id);
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Could Not Load Batches', message: err instanceof ApiError ? err.message : 'Failed to load medicines.' });
    } finally {
      setIsMedicinesLoading(false);
    }
  };

  const loadExpiry = async (page: number) => {
    setIsExpiryLoading(true);
    try {
      const { items, pagination } = await inventoryService.getExpiryRadar('all', page, 50);
      setExpiryItems(items);
      setExpiryPagination(pagination);
    } catch (err) {
      addToast({ type: 'error', title: 'Could Not Load Expiry Radar', message: err instanceof ApiError ? err.message : 'Failed to load expiry data.' });
    } finally {
      setIsExpiryLoading(false);
    }
  };

  const loadLowStock = async (page: number) => {
    setIsLowStockLoading(true);
    try {
      const { items, pagination } = await inventoryService.getLowStock(page, PAGE_SIZE);
      setLowStockItems(items);
      setLowStockPagination(pagination);
    } catch (err) {
      addToast({ type: 'error', title: 'Could Not Load Shortage List', message: err instanceof ApiError ? err.message : 'Failed to load low-stock data.' });
    } finally {
      setIsLowStockLoading(false);
    }
  };

  const loadMovements = async (page: number) => {
    setIsMovementsLoading(true);
    try {
      const { items, pagination } = await inventoryService.listMovements({ page, limit: PAGE_SIZE });
      setMovements(items);
      setMovementsPagination(pagination);
    } catch (err) {
      addToast({ type: 'error', title: 'Could Not Load Audit Trail', message: err instanceof ApiError ? err.message : 'Failed to load stock movements.' });
    } finally {
      setIsMovementsLoading(false);
    }
  };

  const loadAll = () => {
    loadMedicines();
    loadExpiry(1);
    setExpiryPage(1);
    loadLowStock(1);
    setLowStockPage(1);
    loadMovements(1);
    setMovementsPage(1);
  };

  useEffect(() => {
    loadAll();
    if (searchParams.get('action') === 'adjust') {
      setIsAdjustModalOpen(true);
      setSearchParams({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadExpiry(expiryPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiryPage]);

  useEffect(() => {
    loadLowStock(lowStockPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lowStockPage]);

  useEffect(() => {
    loadMovements(movementsPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movementsPage]);

  const handleBatchSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setBatchSearch(val);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => loadMedicines(val), 300);
  };

  // Flatten all batches (current page of medicines only — same capped pattern as elsewhere)
  const allBatches = medicines.flatMap(m =>
    m.batches.map(b => ({
      ...b,
      medicineId: m.id,
      medicineName: m.name,
      genericName: m.genericName,
      category: m.category,
      reorderLevel: m.reorderLevel
    }))
  );

  // Valuation stats — approximate, over the capped medicine set (documented limitation, same as Customers/Suppliers stat strips).
  const totalStockUnits = allBatches.reduce((sum, b) => sum + b.quantity, 0);
  const totalCostValuation = allBatches.reduce((sum, b) => sum + b.quantity * b.purchasePrice, 0);
  const totalRetailValuation = allBatches.reduce((sum, b) => sum + b.quantity * b.mrp, 0);
  const projectedMargin = totalRetailValuation > 0 ? ((totalRetailValuation - totalCostValuation) / totalRetailValuation) * 100 : 0;

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAdjusting) return;
    const med = medicines.find(m => m.id === adjMedId);
    if (!med) return;
    const batch = med.batches.find(b => b.id === adjBatchId) || med.batches[0];
    if (!batch) return;

    const qty = parseInt(adjQty) || 1;

    setIsAdjusting(true);
    try {
      // Server derives medicineName/batchNumber from the medicine/batch
      // record and adjustedBy from the authenticated actor — not sent here.
      await inventoryService.adjustStock({
        medicineId: med.id,
        batchId: batch.id,
        adjustmentType: adjType,
        quantity: qty,
        reason: adjReason,
        notes: adjNotes || undefined
      });

      addToast({
        type: 'success',
        title: 'Stock Adjusted',
        message: `${adjType} recorded for ${med.name} (Batch: ${batch.batchNumber}).`
      });

      setIsAdjustModalOpen(false);
      loadAll();
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Adjustment Not Saved',
        message: err instanceof ApiError ? err.message : 'Failed to record stock adjustment.'
      });
    } finally {
      setIsAdjusting(false);
    }
  };

  const selectedAdjMed = medicines.find(m => m.id === adjMedId);

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Inventory & Live Valuation
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            FEFO batch monitoring, stock valuation, shelf audits and movement trail
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={loadAll}
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<SlidersHorizontal className="w-3.5 h-3.5" />}
            onClick={() => setIsAdjustModalOpen(true)}
          >
            Adjust Stock
          </Button>
        </div>
      </div>

      {/* Overview Stat Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Cost Valuation</span>
          <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
            {formatINR(totalCostValuation)}
          </div>
          <span className="text-[11px] text-slate-400">At wholesale purchase price</span>
        </div>

        <div className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Retail (MRP) Value</span>
          <div className="text-lg font-bold font-mono text-emerald-700 mt-0.5">
            {formatINR(totalRetailValuation)}
          </div>
          <span className="text-[11px] text-slate-400">Projected Margin: ~{projectedMargin.toFixed(1)}%</span>
        </div>

        <div className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Total Live Units</span>
          <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
            {totalStockUnits.toLocaleString('en-IN')} units
          </div>
          <span className="text-[11px] text-slate-400">Across {allBatches.length} active batches</span>
        </div>

        <div className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Expiring Soon (&lt;90d)</span>
          <div className="text-lg font-bold font-mono text-rose-600 mt-0.5">
            {expiryPagination?.total ?? expiryItems.length} batches
          </div>
          <span className="text-[11px] text-slate-400">Review for supplier return</span>
        </div>
      </div>

      {/* Tab Switcher */}
      <Tabs
        activeTab={activeTab}
        onChange={(tab) => setActiveTab(tab as any)}
        tabs={[
          { id: 'batches', label: 'All Batches', badge: allBatches.length },
          { id: 'expiring', label: 'Near Expiry (<90d)', badge: expiryPagination?.total ?? expiryItems.length },
          { id: 'lowstock', label: 'Shortage & Reorders', badge: lowStockPagination?.total ?? lowStockItems.length },
          { id: 'movements', label: 'Audit Trail', badge: movementsPagination?.total ?? movements.length }
        ]}
      />

      {/* Batches Table Tab */}
      {activeTab === 'batches' && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
          <div className="p-3 border-b border-slate-100 bg-slate-50/50">
            <div className="max-w-md">
              <Input
                placeholder="Search batch #, medicine name, generic salt..."
                value={batchSearch}
                onChange={handleBatchSearchChange}
                leftIcon={<Search className="w-4 h-4" />}
                className="text-xs"
              />
            </div>
          </div>

          {isMedicinesLoading ? (
            <div className="p-10 flex items-center justify-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin" /></div>
          ) : allBatches.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-400">No batches match your search.</div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3.5 font-semibold">Medicine & Generic</th>
                  <th className="py-2.5 px-3.5 font-semibold">Batch #</th>
                  <th className="py-2.5 px-3.5 font-semibold">Expiry Date</th>
                  <th className="py-2.5 px-3.5 font-semibold">Rack</th>
                  <th className="py-2.5 px-3.5 font-semibold text-right">Purchase Rate</th>
                  <th className="py-2.5 px-3.5 font-semibold text-right">MRP</th>
                  <th className="py-2.5 px-3.5 font-semibold text-right">Qty</th>
                  <th className="py-2.5 px-3.5 font-semibold text-right">Total Cost</th>
                  <th className="py-2.5 px-3.5 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allBatches.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3.5">
                        <div className="font-semibold text-slate-900">{b.medicineName}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">{b.genericName}</div>
                      </td>
                      <td className="py-2.5 px-3.5 font-mono font-semibold text-slate-800">{b.batchNumber}</td>
                      <td className="py-2.5 px-3.5 font-mono text-slate-600">{b.expiryDate}</td>
                      <td className="py-2.5 px-3.5 text-slate-500 font-mono">{b.rackLocation || 'A-01'}</td>
                      <td className="py-2.5 px-3.5 text-right font-mono">{formatINR(b.purchasePrice)}</td>
                      <td className="py-2.5 px-3.5 text-right font-mono font-semibold">{formatINR(b.mrp)}</td>
                      <td className="py-2.5 px-3.5 text-right font-mono font-bold">
                        <span className={b.quantity <= 10 ? 'text-amber-600' : 'text-slate-900'}>
                          {b.quantity}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-mono font-bold text-slate-900">
                        {formatINR(b.quantity * b.purchasePrice)}
                      </td>
                      <td className="py-2.5 px-3.5 text-center">
                        <Badge variant={b.quantity === 0 ? 'danger' : 'success'} size="sm">
                          {b.quantity === 0 ? 'Out of stock' : b.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          )}
        </div>
      )}

      {/* Near Expiry Tab */}
      {activeTab === 'expiring' && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
          {isExpiryLoading ? (
            <div className="p-10 flex items-center justify-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin" /></div>
          ) : expiryItems.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-400">No batches expiring within 90 days.</div>
          ) : (
          <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3.5 font-semibold">Medicine</th>
                  <th className="py-2.5 px-3.5 font-semibold">Batch #</th>
                  <th className="py-2.5 px-3.5 font-semibold">Expiry Date</th>
                  <th className="py-2.5 px-3.5 font-semibold">Days Remaining</th>
                  <th className="py-2.5 px-3.5 font-semibold text-right">Units at Risk</th>
                  <th className="py-2.5 px-3.5 font-semibold text-right">Purchase Value</th>
                  <th className="py-2.5 px-3.5 font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expiryItems.map((b) => (
                    <tr key={`${b.medicineId}-${b.batchId}`} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3.5 font-semibold text-slate-900">{b.medicineName}</td>
                      <td className="py-2.5 px-3.5 font-mono">{b.batchNumber}</td>
                      <td className="py-2.5 px-3.5 font-mono font-bold text-rose-600">{b.expiryDate}</td>
                      <td className="py-2.5 px-3.5">
                        <Badge variant={b.daysRemaining <= 30 ? 'danger' : 'warning'} size="sm">
                          {b.daysRemaining} days left
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-mono font-bold">{b.quantity}</td>
                      <td className="py-2.5 px-3.5 text-right font-mono font-bold text-rose-600">
                        {formatINR(b.lossExposure)}
                      </td>
                      <td className="py-2.5 px-3.5 text-center">
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => {
                            setAdjMedId(b.medicineId);
                            setAdjBatchId(b.batchId);
                            setAdjType('Mark Expired');
                            setAdjQty(String(b.quantity));
                            setIsAdjustModalOpen(true);
                          }}
                        >
                          Write-Off
                        </Button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {expiryPagination && <Pagination pagination={expiryPagination} onPageChange={setExpiryPage} itemLabel="batches" />}
          </>
          )}
        </div>
      )}

      {/* Low Stock Tab */}
      {activeTab === 'lowstock' && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
          {isLowStockLoading ? (
            <div className="p-10 flex items-center justify-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin" /></div>
          ) : lowStockItems.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-400">All active medicines are sufficiently stocked above reorder thresholds.</div>
          ) : (
          <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3.5 font-semibold">Medicine</th>
                  <th className="py-2.5 px-3.5 font-semibold">Category</th>
                  <th className="py-2.5 px-3.5 font-semibold">Reorder Threshold</th>
                  <th className="py-2.5 px-3.5 font-semibold text-right">Current Live Stock</th>
                  <th className="py-2.5 px-3.5 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lowStockItems.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3.5">
                      <div className="font-semibold text-slate-900">{m.name}</div>
                      <div className="text-[11px] text-slate-400">{m.genericName}</div>
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-600">{m.category}</td>
                    <td className="py-2.5 px-3.5 font-mono">{m.reorderLevel} units</td>
                    <td className="py-2.5 px-3.5 text-right font-mono font-bold">
                      <span className={m.totalStock === 0 ? 'text-rose-600' : 'text-amber-600'}>
                        {m.totalStock} units
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-center">
                      <Badge variant={m.totalStock === 0 ? 'danger' : 'warning'} size="sm">
                        {m.totalStock === 0 ? 'Out of Stock' : 'Low Stock'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {lowStockPagination && <Pagination pagination={lowStockPagination} onPageChange={setLowStockPage} itemLabel="medicines" />}
          </>
          )}
        </div>
      )}

      {/* Movement Ledger Tab */}
      {activeTab === 'movements' && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
          {isMovementsLoading ? (
            <div className="p-10 flex items-center justify-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin" /></div>
          ) : movements.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-400">No stock movements recorded yet.</div>
          ) : (
          <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3.5 font-semibold">Timestamp</th>
                  <th className="py-2.5 px-3.5 font-semibold">Medicine & Batch</th>
                  <th className="py-2.5 px-3.5 font-semibold">Event Type</th>
                  <th className="py-2.5 px-3.5 font-semibold text-right">Delta (Change)</th>
                  <th className="py-2.5 px-3.5 font-semibold text-right">Previous → New</th>
                  <th className="py-2.5 px-3.5 font-semibold">Operator / Ref</th>
                  <th className="py-2.5 px-3.5 font-semibold">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movements.map((mov) => (
                    <tr key={mov.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3.5 font-mono text-slate-500">
                        {formatDate(mov.date)} {formatTime(mov.date)}
                      </td>
                      <td className="py-2.5 px-3.5">
                        <span className="font-semibold text-slate-900">{mov.medicineName}</span>
                        <span className="text-[11px] text-slate-400 font-mono ml-1.5">({mov.batchNumber})</span>
                      </td>
                      <td className="py-2.5 px-3.5">
                        <Badge
                          variant={mov.type === 'Sale' ? 'default' : mov.type === 'Purchase' ? 'success' : mov.type === 'Return' ? 'info' : 'warning'}
                          size="sm"
                        >
                          {mov.type}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-mono font-bold">
                        <span className={mov.quantityChange > 0 ? 'text-emerald-700' : 'text-rose-600'}>
                          {mov.quantityChange > 0 ? `+${mov.quantityChange}` : mov.quantityChange}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-mono text-slate-500">
                        {mov.previousStock} → {mov.newStock}
                      </td>
                      <td className="py-2.5 px-3.5 text-slate-600">
                        <div>{mov.user}</div>
                        {mov.referenceId && <div className="text-[10px] text-slate-400 font-mono">{mov.referenceId}</div>}
                      </td>
                      <td className="py-2.5 px-3.5 text-slate-500 max-w-xs truncate">{mov.notes || '-'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {movementsPagination && <Pagination pagination={movementsPagination} onPageChange={setMovementsPage} itemLabel="movements" />}
          </>
          )}
        </div>
      )}

      {/* Stock Adjustment Modal */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title="Stock Adjustment & Audit Write-Off"
        description="Modify batch quantity with reason for accounting compliance"
        maxWidth="md"
      >
        <form onSubmit={handleAdjustSubmit} className="space-y-3.5">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Select Drug Formulation
            </label>
            <select
              value={adjMedId}
              onChange={(e) => {
                setAdjMedId(e.target.value);
                const m = medicines.find(med => med.id === e.target.value);
                if (m && m.batches.length > 0) {
                  setAdjBatchId(m.batches[0].id);
                }
              }}
              className="w-full h-9 px-3 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-900"
            >
              {medicines.map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.strength})</option>
              ))}
            </select>
          </div>

          {selectedAdjMed && (
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Select Batch
              </label>
              <select
                value={adjBatchId}
                onChange={(e) => setAdjBatchId(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-slate-300 bg-white text-xs font-mono text-slate-900"
              >
                {selectedAdjMed.batches.map(b => (
                  <option key={b.id} value={b.id}>
                    Batch {b.batchNumber} (Exp: {b.expiryDate}) • Current: {b.quantity} units
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Adjustment Type
            </label>
            <select
              value={adjType}
              onChange={(e) => setAdjType(e.target.value as any)}
              className="w-full h-9 px-3 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-900"
            >
              <option value="Subtract Stock">Subtract Stock (Missing / Breakage)</option>
              <option value="Mark Damaged">Mark Damaged</option>
              <option value="Mark Expired">Mark Expired (Write-off)</option>
              <option value="Add Stock">Add Stock (Found Uncounted)</option>
              <option value="Set Stock (Audit)">Set Stock (Physical Audit Count)</option>
            </select>
          </div>

          <Input
            label="Quantity"
            type="number"
            value={adjQty}
            onChange={(e) => setAdjQty(e.target.value)}
            required
          />

          <Input
            label="Reason / Cause"
            placeholder="e.g. Glass ampoule breakage during shelf restocking"
            value={adjReason}
            onChange={(e) => setAdjReason(e.target.value)}
            required
          />

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAdjustModalOpen(false)} disabled={isAdjusting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isAdjusting}>
              Confirm Adjustment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
