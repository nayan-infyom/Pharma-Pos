import { create } from 'zustand';
import { CartItem, Customer, HeldSale, Medicine, Batch, PaymentMethod, SplitPaymentDetail, SaleInvoice } from '../types';
import { heldSalesService } from '../services/heldSalesService';
import { customerService } from '../services/customerService';

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

interface POSState {
  cart: CartItem[];
  customer: Customer | null;
  doctorName: string;
  cartDiscountPercent: number;
  heldSales: HeldSale[];
  
  // Payment modal state
  isPaymentOpen: boolean;
  paymentMethod: PaymentMethod;
  splitDetails: SplitPaymentDetail[];
  amountReceived: number;
  lastCompletedSale: SaleInvoice | null;
  isCompletedModalOpen: boolean;

  // Actions
  addItem: (medicine: Medicine, chosenBatch?: Batch, quantity?: number) => void;
  removeItem: (medicineId: string, batchId: string) => void;
  updateQuantity: (medicineId: string, batchId: string, quantity: number) => void;
  updateItemDiscount: (medicineId: string, batchId: string, discountPercent: number) => void;
  changeItemBatch: (medicineId: string, oldBatchId: string, newBatch: Batch) => void;
  clearCart: () => void;

  setCustomer: (customer: Customer | null) => void;
  setDoctorName: (name: string) => void;
  setCartDiscountPercent: (percent: number) => void;

  // Held sales
  isHeldSalesLoading: boolean;
  loadHeldSales: () => Promise<void>;
  holdSale: (customName?: string) => Promise<void>;
  resumeSale: (heldSaleId: string) => Promise<void>;
  deleteHeldSale: (heldSaleId: string) => Promise<void>;

  // Payment
  openPayment: () => void;
  closePayment: () => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setSplitDetails: (splits: SplitPaymentDetail[]) => void;
  setAmountReceived: (amount: number) => void;
  setLastCompletedSale: (sale: SaleInvoice | null) => void;
  setIsCompletedModalOpen: (open: boolean) => void;

  // Calculated totals
  getSubtotal: () => number;
  getItemDiscounts: () => number;
  getCartDiscountAmount: () => number;
  getTotalDiscount: () => number;
  getTaxTotal: () => number;
  getRoundOff: () => number;
  getGrandTotal: () => number;
}

export const usePOSStore = create<POSState>((set, get) => ({
  cart: [],
  customer: {
    id: 'cust-01',
    name: 'Walk-in Customer',
    phone: '9800000000',
    loyaltyPoints: 0,
    creditLimit: 0,
    outstandingBalance: 0,
    totalPurchases: 15420,
    lastVisit: '2026-08-31'
  },
  doctorName: '',
  cartDiscountPercent: 0,
  heldSales: [],
  isHeldSalesLoading: false,

  isPaymentOpen: false,
  paymentMethod: 'Cash',
  splitDetails: [],
  amountReceived: 0,
  lastCompletedSale: null,
  isCompletedModalOpen: false,

  addItem: (medicine: Medicine, chosenBatch?: Batch, quantity: number = 1) => {
    // Determine batch: use chosenBatch or FEFO (earliest expiry with quantity > 0)
    let targetBatch = chosenBatch;
    if (!targetBatch) {
      const activeBatches = medicine.batches
        .filter(b => b.quantity > 0 && b.status !== 'Expired')
        .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
      
      targetBatch = activeBatches[0] || medicine.batches[0];
    }

    if (!targetBatch) return;

    set((state) => {
      const existingIndex = state.cart.findIndex(
        item => item.medicineId === medicine.id && item.batchId === targetBatch!.id
      );

      if (existingIndex > -1) {
        const existing = state.cart[existingIndex];
        const newQty = existing.quantity + quantity;
        const maxQty = targetBatch!.quantity;
        const clampedQty = Math.min(newQty, maxQty > 0 ? maxQty : 1);

        const subtotal = clampedQty * existing.unitPrice;
        const discountAmount = (subtotal * existing.discountPercent) / 100;
        const taxableAmount = subtotal - discountAmount;
        const taxAmount = (taxableAmount * existing.taxRate) / 100;
        const total = taxableAmount + taxAmount;

        const updatedCart = [...state.cart];
        updatedCart[existingIndex] = {
          ...existing,
          quantity: clampedQty,
          subtotal,
          discountAmount,
          taxAmount,
          total
        };

        return { cart: updatedCart };
      }

      // New item
      const unitPrice = targetBatch!.sellingPrice || medicine.sellingPrice;
      const initialQty = Math.min(quantity, targetBatch!.quantity > 0 ? targetBatch!.quantity : 1);
      const subtotal = initialQty * unitPrice;
      const discountPercent = 0;
      const discountAmount = 0;
      const taxRate = medicine.gstRate || 12;
      const taxAmount = (subtotal * taxRate) / 100;
      const total = subtotal + taxAmount;

      const newItem: CartItem = {
        medicineId: medicine.id,
        medicineName: medicine.name,
        genericName: medicine.genericName,
        brand: medicine.brand,
        dosageForm: medicine.dosageForm,
        strength: medicine.strength,
        packSize: medicine.packSize,
        batchId: targetBatch!.id,
        batchNumber: targetBatch!.batchNumber,
        expiryDate: targetBatch!.expiryDate,
        availableBatchStock: targetBatch!.quantity,
        quantity: initialQty,
        purchasePrice: targetBatch!.purchasePrice,
        mrp: targetBatch!.mrp,
        unitPrice,
        discountPercent,
        discountAmount,
        taxRate,
        taxAmount,
        subtotal,
        total,
        prescriptionRequired: medicine.prescriptionRequired
      };

      return { cart: [newItem, ...state.cart] };
    });
  },

  removeItem: (medicineId: string, batchId: string) => {
    set((state) => ({
      cart: state.cart.filter(item => !(item.medicineId === medicineId && item.batchId === batchId))
    }));
  },

  updateQuantity: (medicineId: string, batchId: string, quantity: number) => {
    set((state) => {
      const updatedCart = state.cart.map(item => {
        if (item.medicineId === medicineId && item.batchId === batchId) {
          const qty = Math.max(1, quantity);
          const subtotal = qty * item.unitPrice;
          const discountAmount = (subtotal * item.discountPercent) / 100;
          const taxableAmount = subtotal - discountAmount;
          const taxAmount = (taxableAmount * item.taxRate) / 100;
          const total = taxableAmount + taxAmount;

          return {
            ...item,
            quantity: qty,
            subtotal,
            discountAmount,
            taxAmount,
            total
          };
        }
        return item;
      });
      return { cart: updatedCart };
    });
  },

  updateItemDiscount: (medicineId: string, batchId: string, discountPercent: number) => {
    set((state) => {
      const disc = Math.min(100, Math.max(0, discountPercent));
      const updatedCart = state.cart.map(item => {
        if (item.medicineId === medicineId && item.batchId === batchId) {
          const discountAmount = (item.subtotal * disc) / 100;
          const taxableAmount = item.subtotal - discountAmount;
          const taxAmount = (taxableAmount * item.taxRate) / 100;
          const total = taxableAmount + taxAmount;

          return {
            ...item,
            discountPercent: disc,
            discountAmount,
            taxAmount,
            total
          };
        }
        return item;
      });
      return { cart: updatedCart };
    });
  },

  changeItemBatch: (medicineId: string, oldBatchId: string, newBatch: Batch) => {
    set((state) => {
      const updatedCart = state.cart.map(item => {
        if (item.medicineId === medicineId && item.batchId === oldBatchId) {
          const unitPrice = newBatch.sellingPrice || item.unitPrice;
          const subtotal = item.quantity * unitPrice;
          const discountAmount = (subtotal * item.discountPercent) / 100;
          const taxableAmount = subtotal - discountAmount;
          const taxAmount = (taxableAmount * item.taxRate) / 100;
          const total = taxableAmount + taxAmount;

          return {
            ...item,
            batchId: newBatch.id,
            batchNumber: newBatch.batchNumber,
            expiryDate: newBatch.expiryDate,
            availableBatchStock: newBatch.quantity,
            purchasePrice: newBatch.purchasePrice,
            mrp: newBatch.mrp,
            unitPrice,
            subtotal,
            discountAmount,
            taxAmount,
            total
          };
        }
        return item;
      });
      return { cart: updatedCart };
    });
  },

  clearCart: () => {
    set({
      cart: [],
      customer: {
        id: 'cust-01',
        name: 'Walk-in Customer',
        phone: '9800000000',
        loyaltyPoints: 0,
        creditLimit: 0,
        outstandingBalance: 0,
        totalPurchases: 15420,
        lastVisit: '2026-08-31'
      },
      doctorName: '',
      cartDiscountPercent: 0,
      amountReceived: 0
    });
  },

  setCustomer: (customer) => set({ customer }),
  setDoctorName: (doctorName) => set({ doctorName }),
  setCartDiscountPercent: (cartDiscountPercent) => set({ cartDiscountPercent: Math.min(100, Math.max(0, cartDiscountPercent)) }),

  loadHeldSales: async () => {
    set({ isHeldSalesLoading: true });
    try {
      const heldSales = await heldSalesService.list();
      set({ heldSales });
    } finally {
      set({ isHeldSalesLoading: false });
    }
  },

  holdSale: async (customName) => {
    const state = get();
    if (state.cart.length === 0) return;

    const subtotal = state.getSubtotal();
    const grandTotal = state.getGrandTotal();
    const taxTotal = state.getTaxTotal();
    // Legacy walk-in placeholder ('cust-01') isn't a real customer record —
    // same guard as salesService.createSale's toBackendCustomerId.
    const isRealCustomer = !!state.customer?.id && OBJECT_ID_RE.test(state.customer.id);

    const created = await heldSalesService.hold({
      name: customName || (isRealCustomer ? `${state.customer!.name}'s Cart` : `Held Cart #${state.heldSales.length + 1}`),
      customerId: isRealCustomer ? state.customer!.id : undefined,
      customerSnapshot: isRealCustomer ? { id: state.customer!.id, name: state.customer!.name, phone: state.customer!.phone } : undefined,
      items: state.cart,
      subtotal,
      discountPercent: state.cartDiscountPercent,
      taxTotal,
      grandTotal
    });

    set((s) => ({
      heldSales: [created, ...s.heldSales],
      cart: [],
      doctorName: '',
      cartDiscountPercent: 0
    }));
  },

  resumeSale: async (heldSaleId) => {
    const state = get();
    const target = state.heldSales.find(h => h.id === heldSaleId);
    if (!target) return;

    // The resumed cart only ever reaches the real sale via medicineId/
    // quantity/discountPercent (salesService.createSale) — server always
    // re-resolves FEFO/batch/pricing fresh at that point, so nothing here
    // (stale unitPrice/mrp/availableBatchStock in the snapshot) can bypass
    // server-authoritative pricing or stock validation.
    let freshCustomer: Customer | null = null;
    if (target.customerId) {
      freshCustomer = (await customerService.getById(target.customerId)) ?? null;
    }

    set({
      cart: target.items,
      customer: freshCustomer,
      cartDiscountPercent: target.discountPercent || 0,
      heldSales: state.heldSales.filter(h => h.id !== heldSaleId)
    });

    try {
      await heldSalesService.remove(heldSaleId);
    } catch {
      // Best-effort — the cart is already resumed locally either way; a
      // failed cleanup just leaves a stale parked-cart row to discard later.
    }
  },

  deleteHeldSale: async (heldSaleId) => {
    await heldSalesService.remove(heldSaleId);
    set((state) => ({ heldSales: state.heldSales.filter(h => h.id !== heldSaleId) }));
  },

  openPayment: () => {
    const total = get().getGrandTotal();
    set({
      isPaymentOpen: true,
      amountReceived: total,
      paymentMethod: 'Cash',
      splitDetails: []
    });
  },

  closePayment: () => set({ isPaymentOpen: false }),
  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
  setSplitDetails: (splitDetails) => set({ splitDetails }),
  setAmountReceived: (amountReceived) => set({ amountReceived }),
  setLastCompletedSale: (lastCompletedSale) => set({ lastCompletedSale }),
  setIsCompletedModalOpen: (isCompletedModalOpen) => set({ isCompletedModalOpen }),

  getSubtotal: () => {
    return get().cart.reduce((sum, item) => sum + item.subtotal, 0);
  },

  getItemDiscounts: () => {
    return get().cart.reduce((sum, item) => sum + item.discountAmount, 0);
  },

  getCartDiscountAmount: () => {
    const subtotal = get().getSubtotal();
    const itemDiscounts = get().getItemDiscounts();
    const balance = subtotal - itemDiscounts;
    return (balance * get().cartDiscountPercent) / 100;
  },

  getTotalDiscount: () => {
    return get().getItemDiscounts() + get().getCartDiscountAmount();
  },

  getTaxTotal: () => {
    // Calculate tax post-discount for each item proportional to cart discount
    const cartDiscPct = get().cartDiscountPercent;
    return get().cart.reduce((sum, item) => {
      const afterItemDisc = item.subtotal - item.discountAmount;
      const afterCartDisc = afterItemDisc * (1 - cartDiscPct / 100);
      const tax = (afterCartDisc * item.taxRate) / 100;
      return sum + tax;
    }, 0);
  },

  getRoundOff: () => {
    const raw = get().getSubtotal() - get().getTotalDiscount() + get().getTaxTotal();
    const rounded = Math.round(raw);
    return Number((rounded - raw).toFixed(2));
  },

  getGrandTotal: () => {
    const raw = get().getSubtotal() - get().getTotalDiscount() + get().getTaxTotal();
    return Math.round(raw);
  }
}));
