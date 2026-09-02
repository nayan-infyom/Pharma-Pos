import React, { useState, useEffect, useRef } from 'react';
import { usePOSStore } from '../store/usePOSStore';
import { useAppStore } from '../store/useAppStore';
import { medicineService } from '../services/medicineService';
import { Medicine } from '../types';
import { 
  Search, 
  Barcode, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingCart, 
  User, 
  Clock, 
  Percent, 
  Pill,
  Stethoscope,
  ChevronRight
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Kbd } from '../components/ui/Kbd';
import { CustomerSelectModal } from '../components/pos/CustomerSelectModal';
import { HeldSalesDrawer } from '../components/pos/HeldSalesDrawer';
import { BatchSelectorModal } from '../components/pos/BatchSelectorModal';
import { PaymentModal } from '../components/pos/PaymentModal';
import { CompletedSaleModal } from '../components/pos/CompletedSaleModal';
import { EmptyState } from '../components/ui/EmptyState';
import { formatINR } from '../utils/formatters';

export const POSPage: React.FC = () => {
  const {
    cart,
    customer,
    doctorName,
    cartDiscountPercent,
    heldSales,
    addItem,
    removeItem,
    updateQuantity,
    updateItemDiscount,
    changeItemBatch,
    clearCart,
    setCustomer,
    setDoctorName,
    setCartDiscountPercent,
    holdSale,
    loadHeldSales,
    openPayment,
    getSubtotal,
    getTotalDiscount,
    getTaxTotal,
    getRoundOff,
    getGrandTotal
  } = usePOSStore();

  const { addToast } = useAppStore();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modals state
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [heldDrawerOpen, setHeldDrawerOpen] = useState(false);
  const [batchModalState, setBatchModalState] = useState<{
    isOpen: boolean;
    medicineId: string;
    medicineName: string;
    currentBatchId: string;
  }>({
    isOpen: false,
    medicineId: '',
    medicineName: '',
    currentBatchId: ''
  });

  const [isHoldingSale, setIsHoldingSale] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleHoldSale = async () => {
    if (cart.length === 0 || isHoldingSale) return;
    setIsHoldingSale(true);
    try {
      await holdSale();
      addToast({
        type: 'info',
        title: 'Cart Held',
        message: 'Transaction saved to Held Carts drawer (F9).'
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Could Not Hold Cart',
        message: err instanceof Error ? err.message : 'Failed to park this cart.'
      });
    } finally {
      setIsHoldingSale(false);
    }
  };

  useEffect(() => {
    loadMedicines();
  }, [selectedCategory]);

  useEffect(() => {
    loadHeldSales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, []);

  // Hotkey listener for F2 (Focus search), F4 (Customer modal), F8 (Hold), F9 (Held Drawer), F6 (Pay)
  useEffect(() => {
    const handlePOSHotkeys = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      } else if (e.key === 'F4') {
        e.preventDefault();
        setCustomerModalOpen(true);
      } else if (e.key === 'F8') {
        e.preventDefault();
        handleHoldSale();
      } else if (e.key === 'F9') {
        e.preventDefault();
        setHeldDrawerOpen(true);
      } else if (e.key === 'F6') {
        e.preventDefault();
        if (cart.length > 0) {
          openPayment();
        }
      }
    };
    window.addEventListener('keydown', handlePOSHotkeys);
    return () => window.removeEventListener('keydown', handlePOSHotkeys);
  }, [cart]);

  const loadMedicines = async () => {
    setIsLoading(true);
    let results = await medicineService.search(searchQuery);
    if (selectedCategory !== 'All') {
      results = results.filter(m => m.category === selectedCategory);
    }
    setMedicines(results);
    setIsLoading(false);
  };

  // Debounced so each keystroke doesn't fire a network request against the
  // real search API (was a free client-side array scan before Phase K).
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(async () => {
      let results = await medicineService.search(val);
      if (selectedCategory !== 'All') {
        results = results.filter(m => m.category === selectedCategory);
      }
      setMedicines(results);
    }, 300);
  };

  // Barcode enter scanner handler. Flushes any pending debounced search
  // immediately so a fast scan-then-Enter doesn't act on stale results.
  const handleBarcodeOrEnter = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    let results = medicines;
    if (searchQuery) {
      results = await medicineService.search(searchQuery);
      if (selectedCategory !== 'All') {
        results = results.filter(m => m.category === selectedCategory);
      }
      setMedicines(results);
    }
    if (results.length > 0) {
      const first = results[0];
      if (first.totalStock > 0) {
        addItem(first);
        addToast({
          type: 'success',
          title: 'Item Added',
          message: `${first.name} added to cart.`
        });
        setSearchQuery('');
        loadMedicines();
      } else {
        addToast({
          type: 'error',
          title: 'Out of Stock',
          message: `${first.name} is currently out of stock.`
        });
      }
    }
  };

  const categories = [
    'All',
    'Antibiotics',
    'Analgesics',
    'Gastrointestinal',
    'Cardiovascular',
    'Antidiabetic',
    'Respiratory',
    'Dermatology'
  ];

  return (
    <div className="h-[calc(100vh-5.5rem)] flex flex-col lg:flex-row gap-4 max-w-[1600px] mx-auto select-none pb-2">
      {/* Left Panel: Medicine Search Grid & Catalog */}
      <div className="flex-1 flex flex-col min-w-0 bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        {/* Search header & Barcode input */}
        <div className="p-3 border-b border-slate-200 space-y-2 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleBarcodeOrEnter}
                placeholder="Search medicine by brand, salt generic, barcode or batch... [F2]"
                className="w-full pl-9 pr-20 py-2 bg-white border border-slate-300 rounded-md text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                autoFocus
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <Barcode className="w-4 h-4 text-slate-400" />
                <Kbd className="text-[10px] py-0.5 px-1 hidden sm:inline-flex">F2</Kbd>
              </div>
            </div>

            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  loadMedicines();
                }}
              >
                Clear
              </Button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer text-xs ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Medicines Fast Grid */}
        <div className="flex-1 p-3 overflow-y-auto">
          {medicines.length === 0 ? (
            <EmptyState
              icon={<Pill className="w-6 h-6 text-slate-400" />}
              title="No medicines match search"
              description="Check spelling or try searching by generic salt composition."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
              {medicines.map((med) => {
                const isOutOfStock = med.totalStock === 0;
                const isLowStock = med.totalStock <= med.reorderLevel && !isOutOfStock;
                const primaryBatch = med.batches.find(b => b.quantity > 0) || med.batches[0];

                return (
                  <div
                    key={med.id}
                    onClick={() => {
                      if (!isOutOfStock) {
                        addItem(med);
                      } else {
                        addToast({
                          type: 'warning',
                          title: 'Stock Depleted',
                          message: `${med.name} is currently out of stock.`
                        });
                      }
                    }}
                    className={`p-3 rounded-lg border transition-colors flex flex-col justify-between ${
                      isOutOfStock
                        ? 'opacity-60 bg-slate-50 border-slate-200 cursor-not-allowed'
                        : 'bg-white border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/20 cursor-pointer shadow-2xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <span className="font-semibold text-xs text-slate-900 line-clamp-1">
                          {med.name}
                        </span>
                        {med.prescriptionRequired && (
                          <Badge variant="rx" size="sm">Rx</Badge>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 truncate">
                        {med.genericName}
                      </p>

                      <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-500 font-mono">
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded font-sans text-slate-700 font-medium">
                          {med.dosageForm} • {med.strength}
                        </span>
                        <span>Rack {med.rackLocation || 'A-01'}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100">
                      <div>
                        <div className="text-xs font-bold font-mono text-slate-900">
                          {formatINR(med.sellingPrice)}
                        </div>
                        <span className="text-[10px] text-slate-400 line-through">
                          MRP {formatINR(med.mrp)}
                        </span>
                      </div>

                      <div className="text-right">
                        <Badge
                          variant={isOutOfStock ? 'danger' : isLowStock ? 'warning' : 'success'}
                          size="sm"
                        >
                          {isOutOfStock ? 'Out of stock' : `${med.totalStock} in stock`}
                        </Badge>
                        {primaryBatch && (
                          <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                            Exp: {primaryBatch.expiryDate}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: Active Billing Cart & Summary */}
      <div className="w-full lg:w-[460px] xl:w-[500px] flex flex-col shrink-0 bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        {/* Customer & Doctor Selector Bar */}
        <div className="p-3 bg-slate-50/70 border-b border-slate-200 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setCustomerModalOpen(true)}
              className="flex-1 flex items-center justify-between p-2 rounded-md bg-white border border-slate-200 hover:border-emerald-600 transition-colors text-left cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-200">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-900 truncate">
                    {customer?.name || 'Walk-in Customer'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono truncate">
                    {customer?.phone || 'Counter Cash Sale'} {customer && customer.loyaltyPoints > 0 ? `• ${customer.loyaltyPoints} pts` : ''}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <Kbd className="text-[10px] py-0.5 px-1">F4</Kbd>
              </div>
            </button>

            {/* Held Sales Trigger */}
            <button
              type="button"
              onClick={() => setHeldDrawerOpen(true)}
              className="relative p-2 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer shadow-2xs"
              title="Held Carts (F9)"
            >
              <Clock className="w-4 h-4" />
              {heldSales.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white font-bold text-[10px] flex items-center justify-center">
                  {heldSales.length}
                </span>
              )}
            </button>
          </div>

          {/* Doctor Name & Quick Cart Controls */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Stethoscope className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Doctor name / Prescription reference..."
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white rounded-md border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
              />
            </div>

            {cart.length > 0 && (
              <Button
                variant="ghost"
                size="xs"
                className="text-rose-600 hover:text-rose-700"
                onClick={clearCart}
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Cart Items Table List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-semibold text-slate-700">Cart is empty</h4>
              <p className="text-[11px] text-slate-400 max-w-xs mt-1">
                Scan barcode or click any medicine from catalog to add items to invoice.
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={`${item.medicineId}-${item.batchId}`}
                className="p-2.5 rounded-lg border border-slate-200 bg-white space-y-2 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs text-slate-900 truncate">
                        {item.medicineName}
                      </span>
                      {item.prescriptionRequired && <Badge variant="rx" size="sm">Rx</Badge>}
                    </div>

                    {/* Batch Pill Trigger */}
                    <button
                      type="button"
                      onClick={() =>
                        setBatchModalState({
                          isOpen: true,
                          medicineId: item.medicineId,
                          medicineName: item.medicineName,
                          currentBatchId: item.batchId
                        })
                      }
                      className="mt-0.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-mono text-slate-600 hover:text-emerald-700 cursor-pointer transition-colors border border-slate-200"
                      title="Click to switch batch"
                    >
                      <span>Batch: {item.batchNumber}</span>
                      <span>•</span>
                      <span>Exp: {item.expiryDate}</span>
                      <ChevronRight className="w-2.5 h-2.5" />
                    </button>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-bold font-mono text-xs text-slate-900">
                      {formatINR(item.total)}
                    </span>
                    <div className="text-[10px] text-slate-400 font-mono">
                      @{formatINR(item.unitPrice)}
                    </div>
                  </div>
                </div>

                {/* Quantity Controls + Discount + Trash */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (item.quantity > 1) {
                          updateQuantity(item.medicineId, item.batchId, item.quantity - 1);
                        } else {
                          removeItem(item.medicineId, item.batchId);
                        }
                      }}
                      className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>

                    <input
                      type="number"
                      min={1}
                      max={item.availableBatchStock}
                      value={item.quantity}
                      onChange={(e) =>
                        updateQuantity(
                          item.medicineId,
                          item.batchId,
                          parseInt(e.target.value) || 1
                        )
                      }
                      className="w-10 h-6 text-center font-bold text-xs bg-slate-50 border border-slate-300 rounded font-mono focus:outline-none focus:border-emerald-600 text-slate-900"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(
                          item.medicineId,
                          item.batchId,
                          Math.min(item.availableBatchStock, item.quantity + 1)
                        )
                      }
                      disabled={item.quantity >= item.availableBatchStock}
                      className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 disabled:opacity-40 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>

                    <span className="text-[10px] text-slate-400 ml-1 font-mono">
                      /{item.availableBatchStock}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Item discount input */}
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-500">Disc:</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        placeholder="0"
                        value={item.discountPercent || ''}
                        onChange={(e) =>
                          updateItemDiscount(
                            item.medicineId,
                            item.batchId,
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-9 h-6 text-center text-[11px] font-mono rounded border border-slate-300 bg-white text-slate-900"
                      />
                      <span className="text-[10px] text-slate-500">%</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.medicineId, item.batchId)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Financial Summary & Checkout Controls */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 space-y-2">
          {/* Cart Discount % field */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-700 flex items-center gap-1 font-medium">
              <Percent className="w-3.5 h-3.5 text-emerald-600" /> Bill Discount:
            </span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={0}
                max={100}
                value={cartDiscountPercent || ''}
                placeholder="0"
                onChange={(e) => setCartDiscountPercent(parseFloat(e.target.value) || 0)}
                className="w-12 h-6 text-right px-1.5 font-mono text-xs font-semibold rounded border border-slate-300 bg-white text-slate-900"
              />
              <span className="text-xs font-semibold text-slate-500">%</span>
            </div>
          </div>

          {/* Breakdown numbers */}
          <div className="space-y-1 text-xs border-t border-slate-200 pt-2 font-mono">
            <div className="flex justify-between text-slate-600">
              <span className="font-sans">Subtotal ({cart.length} items):</span>
              <span>{formatINR(getSubtotal())}</span>
            </div>

            {getTotalDiscount() > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span className="font-sans">Discount Savings:</span>
                <span>-{formatINR(getTotalDiscount())}</span>
              </div>
            )}

            <div className="flex justify-between text-slate-600">
              <span className="font-sans">GST (CGST + SGST):</span>
              <span>{formatINR(getTaxTotal())}</span>
            </div>

            {getRoundOff() !== 0 && (
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span className="font-sans">Round Off:</span>
                <span>{getRoundOff() > 0 ? `+${getRoundOff()}` : getRoundOff()}</span>
              </div>
            )}

            <div className="flex justify-between text-base font-bold text-slate-900 border-t border-slate-200 pt-1.5">
              <span className="font-sans">Grand Total:</span>
              <span className="text-emerald-700 font-mono">
                {formatINR(getGrandTotal())}
              </span>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <Button
              variant="outline"
              size="md"
              disabled={cart.length === 0}
              isLoading={isHoldingSale}
              onClick={handleHoldSale}
              className="text-xs font-semibold"
            >
              Hold (F8)
            </Button>

            <Button
              variant="primary"
              size="md"
              disabled={cart.length === 0}
              onClick={openPayment}
              className="col-span-2 text-xs font-semibold"
              rightIcon={<Kbd className="bg-emerald-700 text-white border-none text-[10px]">F6</Kbd>}
            >
              Complete Sale
            </Button>
          </div>
        </div>
      </div>

      {/* POS Dialogs & Modals */}
      <CustomerSelectModal
        isOpen={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        selectedCustomerId={customer?.id}
        onSelectCustomer={(c) => setCustomer(c)}
      />

      <HeldSalesDrawer
        isOpen={heldDrawerOpen}
        onClose={() => setHeldDrawerOpen(false)}
      />

      <BatchSelectorModal
        isOpen={batchModalState.isOpen}
        onClose={() =>
          setBatchModalState({
            isOpen: false,
            medicineId: '',
            medicineName: '',
            currentBatchId: ''
          })
        }
        medicineId={batchModalState.medicineId}
        medicineName={batchModalState.medicineName}
        currentBatchId={batchModalState.currentBatchId}
        onSelectBatch={(newBatch) => {
          changeItemBatch(batchModalState.medicineId, batchModalState.currentBatchId, newBatch);
          addToast({
            type: 'info',
            title: 'Batch Changed',
            message: `Switched to batch ${newBatch.batchNumber}`
          });
        }}
      />

      <PaymentModal />
      <CompletedSaleModal />
    </div>
  );
};

