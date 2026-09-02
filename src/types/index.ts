export type DosageForm = 
  | 'Tablet' 
  | 'Capsule' 
  | 'Syrup' 
  | 'Injection' 
  | 'Ointment' 
  | 'Drops' 
  | 'Inhaler' 
  | 'Powder' 
  | 'Gel' 
  | 'Suspension';

export type MedicineCategory = 
  | 'Antibiotics'
  | 'Analgesics'
  | 'Antidiabetic'
  | 'Antihypertensive'
  | 'Antihistamines'
  | 'Gastrointestinal'
  | 'Cardiovascular'
  | 'Respiratory'
  | 'Dermatological'
  | 'Vitamins & Supplements'
  | 'Ophthalmic'
  | 'First Aid & Surgical';

export type StockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock';
export type ExpiryStatus = 'Normal' | 'Near Expiry' | 'Expired';

export interface Batch {
  id: string;
  batchNumber: string;
  medicineId: string;
  medicineName?: string;
  supplierId: string;
  supplierName: string;
  quantity: number;
  purchasePrice: number;
  mrp: number;
  sellingPrice: number;
  mfgDate: string; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD
  status: 'Active' | 'Near Expiry' | 'Expired' | 'Out of Stock';
  rackLocation?: string;
}

export interface Medicine {
  id: string;
  name: string;
  genericName: string;
  brand: string;
  category: MedicineCategory;
  manufacturer?: string;
  dosageForm: DosageForm;
  strength: string; // e.g. "500 mg", "10 ml", "250 mcg"
  packSize: string; // e.g. "10 Tablets / Strip", "100 ml Bottle"
  sku?: string;
  barcode: string;
  purchasePrice: number;
  mrp: number;
  sellingPrice: number;
  gstRate: number; // e.g. 5, 12, 18
  hsnCode?: string;
  reorderLevel: number;
  totalStock: number;
  prescriptionRequired: boolean;
  storageInstructions?: string; // e.g. "Store below 25°C", "Keep in refrigerator (2-8°C)"
  batches: Batch[];
  status?: 'Active' | 'Archived';
  description?: string;
  sideEffects?: string;
  rackLocation?: string;
  isScheduleH?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  medicineId: string;
  medicineName: string;
  genericName: string;
  brand: string;
  dosageForm: DosageForm;
  strength: string;
  packSize: string;
  batchId: string;
  batchNumber: string;
  expiryDate: string;
  availableBatchStock: number;
  quantity: number;
  purchasePrice: number;
  mrp: number;
  unitPrice: number; // selling price per unit
  discountPercent: number;
  discountAmount: number;
  taxRate: number; // GST %
  taxAmount: number;
  subtotal: number;
  total: number;
  prescriptionRequired: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  patientAge?: number;
  patientGender?: 'Male' | 'Female' | 'Other';
  loyaltyPoints: number;
  creditLimit: number;
  outstandingBalance: number;
  totalPurchases: number;
  lastVisit: string;
  notes?: string;
  allergies?: string[];
  chronicConditions?: string[];
  doctorName?: string;
}

/** Append-only Khata ledger entry (backend CustomerLedgerEntry — see server/src/models/CustomerLedgerEntry.model.ts).
 *  Signed amount: CreditSale/Adjustment(+) increase outstandingBalance, Payment/ReturnCredit decrease it. */
export interface CustomerLedgerEntry {
  id: string;
  customerId: string;
  type: 'CreditSale' | 'Payment' | 'ReturnCredit' | 'Adjustment';
  amount: number;
  balanceAfter: number;
  referenceId: string;
  notes?: string;
  createdAt: string;
}

export type PaymentMethod = 'Cash' | 'UPI' | 'Card' | 'Bank Transfer' | 'Credit' | 'Split' | 'UPI/QR';

export interface SplitPaymentDetail {
  method: 'Cash' | 'UPI' | 'Card' | 'Bank Transfer' | 'Credit';
  amount: number;
  reference?: string;
}

export interface SaleInvoice {
  id: string;
  invoiceNumber: string;
  date: string; // ISO string
  createdAt?: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  doctorName?: string;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  roundOff: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  splitDetails?: SplitPaymentDetail[];
  amountPaid: number;
  changeDue: number;
  changeReturned?: number;
  status: 'Completed' | 'Refunded' | 'Partially Refunded' | 'Cancelled';
  cashierName: string;
  cashierId: string;
  storeName: string;
  notes?: string;
}

export interface HeldSale {
  id: string;
  name: string;
  heldAt: string;
  // The backend stores customerId (a real reference) + a lightweight
  // {id,name,phone} customerSnapshot for display — not the full Customer
  // (see api/heldSales.ts). `customer` here is reconstructed from that
  // snapshot for the drawer's own list preview; resuming a sale re-fetches
  // the real, current Customer by customerId rather than trusting this
  // possibly-stale snapshot (loyaltyPoints/outstandingBalance/etc. would be
  // wrong here) — see usePOSStore.resumeSale.
  customerId?: string;
  customer?: Customer | null;
  items: CartItem[];
  subtotal: number;
  discountPercent: number;
  taxTotal: number;
  grandTotal: number;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  gstin: string;
  drugLicense: string;
  drugLicenseNumber?: string;
  creditDays: number;
  outstandingAmount: number;
  totalPurchases: number;
  status: 'Active' | 'Inactive';
}

/** Append-only supplier payable ledger entry (backend SupplierLedgerEntry).
 *  Signed amount: PurchaseCredit/Adjustment(+) increase outstandingAmount, Payment/PurchaseReturnDebit decrease it. */
export interface SupplierLedgerEntry {
  id: string;
  supplierId: string;
  type: 'PurchaseCredit' | 'Payment' | 'PurchaseReturnDebit' | 'Adjustment';
  amount: number;
  balanceAfter: number;
  referenceId: string;
  notes?: string;
  createdAt: string;
}

export interface PurchaseItem {
  medicineId: string;
  medicineName: string;
  batchNumber: string;
  mfgDate: string;
  expiryDate: string;
  quantity: number;
  freeQuantity: number;
  purchasePrice: number;
  mrp: number;
  // Required by the backend (no auto-margin rule — purchasing staff sets it explicitly, validated <= mrp).
  sellingPrice: number;
  taxRate: number;
  taxAmount: number;
  discountPercent: number;
  total: number;
}

export type PurchaseOrderItem = PurchaseItem;

export interface PurchaseOrder {
  id: string;
  invoiceNumber: string;
  supplierId: string;
  supplierName: string;
  orderDate: string;
  deliveryDate: string;
  expectedDeliveryDate?: string;
  receivedDate?: string;
  items: PurchaseItem[];
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  grandTotal: number;
  paymentStatus: 'Paid' | 'Pending' | 'Partial';
  paidAmount: number;
  status: 'Received' | 'Ordered' | 'Cancelled';
  notes?: string;
}

export interface PrescriptionItem {
  // Optional: a prescription frequently names a drug the pharmacy hasn't
  // catalogued yet (handwritten Rx, generic substitution) — see backend
  // Prescription.model.ts. Not existence-checked against Medicine either.
  medicineId?: string;
  medicineName: string;
  dosage: string;
  frequency?: string;
  duration: string;
  quantity: number;
  instructions?: string;
  timing?: 'Before Food' | 'After Food' | 'With Food' | 'Empty Stomach' | 'Bedtime';
}

export interface Prescription {
  id: string;
  prescriptionNumber: string;
  customerId?: string;
  // customerName does not exist on the backend model — patientName is the
  // one canonical field. Kept optional here only so old call sites that
  // still do `rx.customerName || rx.patientName` keep compiling.
  customerName?: string;
  patientName: string;
  patientAge?: number;
  patientGender?: 'Male' | 'Female' | 'Other';
  patientPhone?: string;
  doctorName: string;
  hospitalClinic?: string;
  doctorRegistrationNumber?: string;
  prescribedDate: string;
  expiryDate?: string;
  diagnosis?: string;
  items: PrescriptionItem[];
  refillsAllowed?: number;
  refillsRemaining?: number;
  notes?: string;
  attachmentUrl?: string;
  status: 'Active' | 'Dispensed' | 'Partially Dispensed' | 'Expired' | 'Pending';
}

export type SalesReturnReason = 'Damaged Packaging' | 'Wrong Dosage' | 'Doctor Changed Rx' | 'Adverse Reaction' | 'Patient Recovered' | 'Other';
export type PurchaseReturnReason = 'Near Expiry Received' | 'Damaged in Transit' | 'Excess Stock' | 'Rate Discrepancy';

export interface SalesReturn {
  id: string;
  returnNumber: string;
  // Real document reference — server validates returnQuantity against this
  // sale's actual billed quantity (BUSINESS_RULES.md Rule 5.1), never a
  // free-text invoice number.
  originalSaleId: string;
  originalInvoiceNumber: string;
  customerId?: string;
  customerName: string;
  date: string;
  items: {
    medicineId: string;
    medicineName: string;
    batchNumber: string;
    returnQuantity: number;
    // Server-derived from the original sale line — never client-supplied.
    unitPrice: number;
    refundAmount: number;
    reason: SalesReturnReason;
  }[];
  totalRefundAmount: number;
  refundMethod: 'Cash' | 'Credit Note' | 'Original Payment';
  processedBy: string;
  notes?: string;
}

export interface PurchaseReturn {
  id: string;
  returnNumber: string;
  purchaseOrderId: string;
  purchaseInvoiceNumber: string;
  supplierId: string;
  supplierName: string;
  date: string;
  items: {
    medicineId: string;
    medicineName: string;
    batchNumber: string;
    quantity: number;
    // Server-derived from the original purchase order line — never client-supplied.
    purchasePrice: number;
    totalAmount: number;
    reason: PurchaseReturnReason;
  }[];
  totalAmount: number;
  status: 'Pending' | 'Approved' | 'Adjusted';
  notes?: string;
}

/** Thin summary row from the combined /returns list — item-level detail
 *  (reason, refundMethod, items) requires the type-specific detail endpoint. */
export interface CombinedReturnRow {
  id: string;
  type: 'Sales Return' | 'Purchase Return';
  returnNumber: string;
  referenceInvoiceNumber: string;
  partyName: string;
  date: string;
  amount: number;
}

export type ExpenseCategory = 
  | 'Utilities'
  | 'Rent'
  | 'Salaries'
  | 'Cold Chain Electricity'
  | 'Bio-Waste Disposal'
  | 'Packaging & Stationery'
  | 'Software & Subscriptions'
  | 'Maintenance'
  | 'Other'
  | 'Utilities / Electricity'
  | 'Salaries & Wages'
  | 'Cold Chain / Refrigeration'
  | 'Packaging & Pharmacy Bags'
  | 'Cleaning & Sanitation'
  | 'Software & Telecom'
  | 'Maintenance & Repairs'
  | 'Miscellaneous';

export interface Expense {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  paymentMethod: 'Cash' | 'Bank Transfer' | 'UPI' | 'Card';
  addedBy?: string;
  recordedBy?: string;
  paidTo?: string;
  receiptNumber?: string;
  notes?: string;
}

/**
 * Report response shapes — mirror server/src/services/reportService.ts
 * exactly. Every figure here (COGS, gross profit, GST, velocity ranking) is
 * a real backend aggregation; the frontend only renders these, it never
 * recomputes them (the previous ReportsPage's `netSales * 0.65` COGS
 * estimate, `idx % 2` fast-mover flag, and hardcoded 5/6 months of chart
 * data were placeholder demo values, not real business logic — see the
 * backend service's own comment documenting this).
 */
export interface SalesSummaryReport {
  from: string;
  to: string;
  grossSales: number;
  totalDiscounts: number;
  netSales: number;
  taxTotal: number;
  invoiceCount: number;
  paymentMethodBreakdown: { method: string; total: number; count: number }[];
}

export interface ProfitAndLossReport {
  from: string;
  to: string;
  grossSales: number;
  totalDiscounts: number;
  netSales: number;
  cogs: number;
  grossProfit: number;
  grossMarginPercent: number;
  totalOperatingExpenses: number;
  expenseBreakdown: { category: string; total: number }[];
  netOperatingIncome: number;
}

export interface GstReport {
  from: string;
  to: string;
  totalGstCollected: number;
  totalGstPaidOnPurchases: number;
  netGstPayable: number;
}

export interface CategoryDistributionItem {
  category: string;
  totalStock: number;
}

export interface MonthlyTrendItem {
  year: number;
  month: number;
  sales: number;
  profit: number;
  expenses: number;
}

export interface TopMedicineItem {
  medicineId: string;
  medicineName: string;
  quantitySold: number;
  revenue: number;
}

export type Permission = 
  | 'all'
  | 'pos'
  | 'rx'
  | 'inventory'
  | 'view_pos'
  | 'create_sale'
  | 'refund_sale'
  | 'view_inventory'
  | 'adjust_inventory'
  | 'manage_medicines'
  | 'manage_purchases'
  | 'view_reports'
  | 'manage_employees'
  | 'manage_settings';

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'Admin' | 'Chief Pharmacist' | 'Staff Pharmacist' | 'Cashier' | 'Inventory Specialist' | 'Pharmacist' | 'Inventory Manager';
  status: 'Active' | 'On Leave' | 'Inactive';
  lastActive?: string;
  joinedDate: string;
  permissions: Permission[];
  avatarUrl?: string;
  licenseNumber?: string;
  shiftTiming?: string;
  cashDrawerLimit?: number;
}

export interface PharmacySettings {
  pharmacyName: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  gstin: string;
  drugLicenseNumber: string;
  currency: string;
  currencySymbol: string;
  taxRateDefault: number;
  roundOffGrandTotal: boolean;
  lowStockAlertThreshold: number;
  receiptType: 'thermal' | 'a4';
  invoicePrefix: string;
  receiptFooterNote: string;
}

export interface StoreSettings {
  name: string;
  tagline: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  gstin: string;
  drugLicenseNumber20B: string;
  drugLicenseNumber21B: string;
  fssaiNumber: string;
}

export interface POSSettings {
  defaultTaxRate: number;
  invoicePrefix: string;
  thermalReceiptWidth: '58mm' | '80mm' | 'A4';
  autoPrintReceipt: boolean;
  enableSoundEffects: boolean;
  enableFEFOSuggestion: boolean;
  allowNegativeStock: boolean;
  requireDoctorNameForRx: boolean;
  roundOffTotal: boolean;
}

export interface InventorySettings {
  lowStockThreshold: number;
  criticalStockThreshold: number;
  expiryWarningDays: number;
  criticalExpiryDays: number;
  enforceFEFO: boolean;
  autoReorderAlerts: boolean;
}

export interface StockMovement {
  id: string;
  date: string;
  medicineId: string;
  medicineName: string;
  batchNumber: string;
  type: 'Purchase' | 'Sale' | 'Return' | 'Adjustment' | 'Expired' | 'Damaged';
  quantityChange: number; // positive or negative
  previousStock: number;
  newStock: number;
  user: string;
  referenceId: string; // invoice or PO #
  notes?: string;
}

export interface StockAdjustment {
  id: string;
  date: string;
  medicineId: string;
  medicineName: string;
  batchId: string;
  batchNumber: string;
  adjustmentType: 'Add Stock' | 'Subtract Stock' | 'Set Stock (Audit)' | 'Mark Damaged' | 'Mark Expired';
  quantity: number;
  reason: string;
  notes?: string;
  adjustedBy: string;
}

/** Cross-medicine near-expiry surveillance row (server-aggregated — see
 *  GET /api/inventory/expiry-radar). lossExposure uses purchase cost, not MRP. */
export interface ExpiryRadarItem {
  medicineId: string;
  medicineName: string;
  genericName: string;
  category: string;
  batchId: string;
  batchNumber: string;
  quantity: number;
  expiryDate: string;
  purchasePrice: number;
  mrp: number;
  lossExposure: number;
  daysRemaining: number;
}
