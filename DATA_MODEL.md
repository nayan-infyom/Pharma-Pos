# DATA_MODEL.md — Domain Entities & Type Definitions

> **Important Note**: This document reflects the **actual frontend TypeScript data model** defined in `src/types/index.ts`. All entities are currently serialized as JSON in browser `localStorage`. This is not yet an active PostgreSQL relational schema.

---

## 1. Medicine & Batch Subsystem

### `Medicine`
The master pharmaceutical catalog entry.
```typescript
interface Medicine {
  id: string;                         // Unique ID (e.g., 'med-01')
  name: string;                       // Commercial Brand Name (e.g., 'Augmentin 625 Duo')
  genericName: string;                // Salt / Active Chemical (e.g., 'Amoxicillin (500mg) + Clavulanic Acid (125mg)')
  brand: string;                      // Manufacturer / Brand Line (e.g., 'GSK Pharmaceuticals')
  category: MedicineCategory;         // Therapeutic Category
  manufacturer?: string;              // Pharma manufacturer
  dosageForm: DosageForm;             // 'Tablet' | 'Capsule' | 'Syrup' | 'Injection' | 'Ointment' | 'Drops' | 'Inhaler' | 'Powder' | 'Gel' | 'Suspension'
  strength: string;                   // Dosage strength (e.g., '625 mg', '500 mg')
  packSize: string;                   // Packaging specification (e.g., '10 Tablets / Strip')
  sku?: string;                       // Internal SKU identifier
  barcode: string;                    // EAN-13 / UPC Barcode string (e.g., '8901038382912')
  purchasePrice: number;              // Standard wholesale cost price (in ₹)
  mrp: number;                        // Maximum Retail Price printed on pack (in ₹)
  sellingPrice: number;               // Retail selling price after standard counter discount (in ₹)
  gstRate: number;                    // Applicable Indian GST percentage (e.g., 5, 12, 18)
  hsnCode?: string;                   // Harmonized System of Nomenclature code (e.g., '3004')
  reorderLevel: number;               // Threshold below which low-stock warning triggers (e.g., 20)
  totalStock: number;                 // Sum of all active batch quantities
  prescriptionRequired: boolean;      // True if Schedule H / Prescription-only drug
  storageInstructions?: string;       // E.g., 'Store below 25°C', '2°C to 8°C (Refrigerated)'
  batches: Batch[];                   // Array of associated batch inventory records
  status?: 'Active' | 'Archived';
  description?: string;
  sideEffects?: string;
  rackLocation?: string;              // Physical shelf rack in pharmacy (e.g., 'Rack A-04')
  isScheduleH?: boolean;              // Schedule H / H1 compliance flag
  createdAt: string;                  // ISO 8601 Timestamp
  updatedAt: string;                  // ISO 8601 Timestamp
}
```

### `Batch`
Inventory lot tracked by manufacturing date and expiry date.
```typescript
interface Batch {
  id: string;                         // Unique Batch ID (e.g., 'batch-01-a')
  batchNumber: string;                // Manufacturer Batch No. (e.g., 'AG-62501')
  medicineId: string;                 // Parent Medicine ID reference
  medicineName?: string;
  supplierId: string;                 // Inwarding supplier ID
  supplierName: string;
  quantity: number;                   // Units available in this specific lot
  purchasePrice: number;              // Lot purchase cost (₹)
  mrp: number;                        // Lot printed MRP (₹)
  sellingPrice: number;               // Lot selling price (₹)
  mfgDate: string;                    // Manufacturing Date (YYYY-MM-DD)
  expiryDate: string;                 // Expiry Date (YYYY-MM-DD)
  status: 'Active' | 'Near Expiry' | 'Expired' | 'Out of Stock';
  rackLocation?: string;              // Specific lot location
}
```

---

## 2. Sales & Point of Sale (POS) Entities

### `CartItem`
An active line-item in the POS checkout session.
```typescript
interface CartItem {
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
  unitPrice: number;                  // Selling price per unit
  discountPercent: number;            // Line-item discount (0 - 100%)
  discountAmount: number;             // Line discount value (₹)
  taxRate: number;                    // GST Rate % (5, 12, 18)
  taxAmount: number;                  // Computed GST value (₹)
  subtotal: number;                   // quantity * unitPrice
  total: number;                      // (subtotal - discountAmount) + taxAmount
  prescriptionRequired: boolean;
}
```

### `SaleInvoice`
An immutable completed sales receipt.
```typescript
interface SaleInvoice {
  id: string;                         // Unique Sale ID (e.g., 'sale-1725200000000')
  invoiceNumber: string;              // Sequential invoice code (e.g., 'INV-2026-1001')
  date: string;                       // ISO 8601 timestamp
  createdAt?: string;
  customerId?: string;                // Optional registered customer ID
  customerName: string;               // Customer / Patient Name (or 'Walk-in Customer')
  customerPhone?: string;
  doctorName?: string;                // Prescribing doctor name
  items: CartItem[];                  // Sold line items with batch snapshots
  itemCount: number;                  // Number of distinct line items
  subtotal: number;                   // Sum of item subtotals
  discountTotal: number;              // Total discounts applied
  taxTotal: number;                   // Total GST collected
  roundOff: number;                   // Cash rounding adjustment (+/- ₹)
  grandTotal: number;                 // Net payable amount
  paymentMethod: PaymentMethod;       // 'Cash' | 'UPI' | 'Card' | 'Bank Transfer' | 'Credit' | 'Split' | 'UPI/QR'
  splitDetails?: SplitPaymentDetail[];// Breakdown when paymentMethod is 'Split'
  amountPaid: number;                 // Tendered amount
  changeDue: number;                  // Change returned to customer
  status: 'Completed' | 'Refunded' | 'Partially Refunded' | 'Cancelled';
  cashierName: string;
  cashierId: string;
  storeName: string;
  notes?: string;
}
```

---

## 3. Customer & Khata Ledgers

### `Customer`
```typescript
interface Customer {
  id: string;                         // Unique ID (e.g., 'cust-01')
  name: string;                       // Full name
  phone: string;                      // 10-digit mobile number
  email?: string;
  address?: string;
  city?: string;
  patientAge?: number;
  patientGender?: 'Male' | 'Female' | 'Other';
  loyaltyPoints: number;              // Accrued reward points
  creditLimit: number;                // Maximum allowed Khata debt (₹)
  outstandingBalance: number;         // Current unpaid credit balance (₹)
  totalPurchases: number;             // Lifetime spend (₹)
  lastVisit: string;                  // YYYY-MM-DD
  notes?: string;
  allergies?: string[];               // E.g., ['Penicillin', 'Sulfa Drugs']
  chronicConditions?: string[];       // E.g., ['Hypertension', 'Type 2 Diabetes']
  doctorName?: string;                // Primary consulting physician
}
```

---

## 4. Purchases (Inward Procurement)

### `PurchaseOrder` & `PurchaseItem`
```typescript
interface PurchaseItem {
  medicineId: string;
  medicineName: string;
  batchNumber: string;
  mfgDate: string;
  expiryDate: string;
  quantity: number;                   // Invoiced quantity
  freeQuantity: number;               // Bonus / Free scheme units
  purchasePrice: number;              // Unit purchase rate (₹)
  mrp: number;                        // Pack printed MRP (₹)
  taxRate: number;                    // GST %
  taxAmount: number;                  // Inward tax amount
  discountPercent: number;            // Trade discount %
  total: number;                      // Line total
}

interface PurchaseOrder {
  id: string;
  invoiceNumber: string;              // Distributor Purchase Invoice No.
  supplierId: string;
  supplierName: string;
  orderDate: string;
  deliveryDate: string;
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
```

---

## 5. Prescriptions Subsystem

### `Prescription`
```typescript
interface PrescriptionItem {
  medicineId: string;
  medicineName: string;
  dosage: string;                     // E.g., '1-0-1 (After Food)'
  duration: string;                   // E.g., '15 days'
  quantity: number;                   // Number of units/strips
  timing?: 'Before Food' | 'After Food' | 'With Food' | 'Empty Stomach' | 'Bedtime';
  instructions?: string;
}

interface Prescription {
  id: string;
  prescriptionNumber: string;         // E.g., 'RX-88901'
  customerId?: string;
  customerName?: string;
  patientName?: string;
  patientAge?: number;
  patientGender?: 'Male' | 'Female' | 'Other';
  patientPhone?: string;
  doctorName: string;
  hospitalClinic: string;
  doctorRegistrationNumber?: string;
  prescribedDate?: string;
  expiryDate?: string;
  diagnosis: string;
  items?: PrescriptionItem[];
  attachmentUrl?: string;             // Scanned prescription image URL
  status: 'Active' | 'Dispensed' | 'Partially Dispensed' | 'Expired' | 'Pending';
}
```

---

## 6. Inventory Movements & Audits

### `StockMovement`
```typescript
interface StockMovement {
  id: string;
  date: string;                       // ISO 8601
  medicineId: string;
  medicineName: string;
  batchNumber: string;
  type: 'Purchase' | 'Sale' | 'Return' | 'Adjustment' | 'Expired' | 'Damaged';
  quantityChange: number;             // + for stock in, - for stock out
  previousStock: number;
  newStock: number;
  user: string;
  referenceId: string;                // Invoice # or PO #
  notes?: string;
}
```
