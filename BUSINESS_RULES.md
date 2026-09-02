# BUSINESS_RULES.md — Pharmacy Business Rules & Mathematical Invariants

This document is the **strict source of truth** for all domain rules, safety constraints, financial calculations, and validation logic in the Pharma POS application.

---

## 1. Inventory & Batch Rules

### Rule 1.1: Batch-Level Granularity
- **RULE**: Every medicine in stock must belong to a specific `Batch` record containing: `batchNumber`, `expiryDate`, `mfgDate`, `purchasePrice`, `mrp`, `sellingPrice`, and `quantity`.
- **WHY IT MATTERS**: In pharmaceuticals, two packages of the same drug may have different manufacturing dates, expiry dates, supplier sources, and cost bases.
- **WHERE IMPLEMENTED**: `src/types/index.ts`, `medicineService.ts`, `usePOSStore.ts`.
- **AI MUST NOT**: Flatten batches into a single aggregate medicine quantity without tracking individual batch records.

### Rule 1.2: FEFO (First-Expiry-First-Out) Dispensing
- **RULE**: When a medicine is added to the cart without manual batch selection, the system **MUST** select the active batch with positive stock (`quantity > 0`) that has the earliest valid `expiryDate`.
- **FORMULA / SORT**:
  $$\text{Sort active batches by } \text{Date}(\text{expiryDate}).\text{getTime}() \text{ ascending}$$
- **WHY IT MATTERS**: Reduces inventory obsolescence and prevents selling near-expiry stock while newer stock sits on the shelf.
- **WHERE IMPLEMENTED**: `usePOSStore.ts` (`addItem` method), `POSPage.tsx`.
- **AI MUST NOT**: Sort by LIFO, FIFO (by creation date), or random batch selection.

### Rule 1.3: Expiry Status Classification
- **RULE**: Batch expiry urgency is classified into 4 standardized tiers:
  1. **Expired**: $\text{Days Remaining} \le 0$ $\rightarrow$ Status: `Expired` (DANGER / CANNOT SELL).
  2. **Critical Expiry**: $1 \le \text{Days Remaining} \le 7$ $\rightarrow$ Status: `Near Expiry` (DANGER).
  3. **Near Expiry (30d)**: $8 \le \text{Days Remaining} \le 30$ $\rightarrow$ Status: `Near Expiry` (WARNING).
  4. **Watchlist (90d)**: $31 \le \text{Days Remaining} \le 90$ $\rightarrow$ Status: `Near Expiry` (INFO).
  5. **Healthy**: $\text{Days Remaining} > 90$ $\rightarrow$ Status: `Active` (SUCCESS).
- **WHERE IMPLEMENTED**: `src/utils/formatters.ts` (`getExpiryStatus`), `InventoryPage.tsx`, `DashboardPage.tsx`.

### Rule 1.4: Sales Stock Deduction
- **RULE**: When a sale is finalized, stock is deducted directly from the specific batch chosen for each cart item:
  $$\text{batch.quantity}_{\text{new}} = \max(0, \text{batch.quantity}_{\text{old}} - \text{item.quantity})$$
  $$\text{medicine.totalStock}_{\text{new}} = \sum \text{batch.quantity}$$
- **WHERE IMPLEMENTED**: `salesService.ts` (`createSale`), `medicineService.ts` (`deductStock`).
- **AI MUST NOT**: Bypass `medicineService.deductStock` during sale creation.

### Rule 1.5: Stock Movement Audit Logging
- **RULE**: Every single stock change (Sale, Purchase, Return, Manual Adjustment, Expiry write-off, Damage write-off) **MUST** append an immutable entry to `StockMovement` recording:
  - `date`, `medicineId`, `medicineName`, `batchNumber`, `type`, `quantityChange` (+ or -), `previousStock`, `newStock`, `user`, `referenceId` (Invoice# or PO#), `notes`.
- **WHERE IMPLEMENTED**: `inventoryService.ts` (`recordMovement`), `salesService.ts`, `purchaseService.ts`.

---

## 2. Sales, Tax & Pricing Calculations

### Rule 2.1: Line-Item Financial Formulas
For each item in the cart:
$$\text{Line Subtotal} = \text{unitPrice} \times \text{quantity}$$
$$\text{Line Discount Amount} = \frac{\text{Line Subtotal} \times \text{discountPercent}}{100}$$
$$\text{Line Taxable Amount} = \text{Line Subtotal} - \text{Line Discount Amount}$$
$$\text{Line Tax Amount} = \frac{\text{Line Taxable Amount} \times \text{taxRate}}{100}$$
$$\text{Line Total} = \text{Line Taxable Amount} + \text{Line Tax Amount}$$

### Rule 2.2: Cart-Level & Invoice Aggregation
$$\text{Cart Subtotal} = \sum \text{Line Subtotal}$$
$$\text{Item Discounts Total} = \sum \text{Line Discount Amount}$$
$$\text{Cart-Wide Discount Amount} = \frac{(\text{Cart Subtotal} - \text{Item Discounts Total}) \times \text{cartDiscountPercent}}{100}$$
$$\text{Total Discount} = \text{Item Discounts Total} + \text{Cart-Wide Discount Amount}$$
$$\text{Total Tax (GST)} = \sum \text{Line Tax Amount}$$
$$\text{Raw Grand Total} = \text{Cart Subtotal} - \text{Total Discount} + \text{Total Tax}$$
$$\text{Grand Total (Rounded)} = \text{Math.round}(\text{Raw Grand Total})$$
$$\text{Round-Off Amount} = \text{Grand Total (Rounded)} - \text{Raw Grand Total}$$

- **WHERE IMPLEMENTED**: `usePOSStore.ts` (helper getters), `PaymentModal.tsx`.
- **AI MUST NOT**: Calculate GST on the undiscounted subtotal; tax must always be calculated on the post-discount taxable amount.

---

## 3. Pharmacy Safety & Clinical Constraints

### Rule 3.1: Expired Medicines Blocking Constraint
- **BLOCKING CONDITION**: Under no circumstances may an expired batch (`daysUntilExpiry <= 0` or `status === 'Expired'`) be added to the POS cart or billed to a customer.
- **WHERE IMPLEMENTED**: `usePOSStore.ts` (`addItem`), `BatchSelectorModal.tsx`.

### Rule 3.2: Schedule H & Prescription Verification
- **WARNING / COMPLIANCE RULE**:
  - If a medicine has `prescriptionRequired === true` or `isScheduleH === true`, the POS interface must flag the item with a clear visual warning badge (`Rx / Schedule H`).
  - If store settings enforce `requireDoctorNameForRx === true`, the sale cannot proceed without entering a prescribing doctor's name or linking a valid digital prescription.
- **WHERE IMPLEMENTED**: `POSPage.tsx`, `PaymentModal.tsx`, `usePOSStore.ts`.

### Rule 3.3: Patient Allergy & Chronic Alerts
- **CLINICAL WARNING**:
  - When a customer with recorded allergies or chronic conditions is linked to a POS sale, the system checks for conflict warnings in the customer banner to assist pharmacist clinical judgment.
- **WHERE IMPLEMENTED**: `POSPage.tsx`, `CustomerSelectModal.tsx`, `CustomersPage.tsx`.

---

## 4. Customer Khata (Store Credit) Rules

### Rule 4.1: Credit Sale Creation
- **RULE**: If `paymentMethod === 'Credit'`:
  - `SaleInvoice.paymentStatus` is set to `'Pending'`.
  - Customer's `outstandingBalance` increases by `sale.grandTotal`:
    $$\text{outstandingBalance}_{\text{new}} = \text{outstandingBalance}_{\text{old}} + \text{grandTotal}$$
  - If customer has a defined `creditLimit > 0`, the new outstanding balance must be checked against `creditLimit` (displays warning if exceeded).
- **WHERE IMPLEMENTED**: `salesService.ts`, `customerService.ts` (`recordPurchase`).

### Rule 4.2: Khata Settlement
- **RULE**: When a customer makes a debt repayment:
  $$\text{outstandingBalance}_{\text{new}} = \max(0, \text{outstandingBalance}_{\text{old}} - \text{amountReceived})$$
- **WHERE IMPLEMENTED**: `customerService.ts` (`settleBalance`), `CustomersPage.tsx`, `DashboardPage.tsx`.

---

## 5. Returns & Restocking Rules

### Rule 5.1: Sales Return Eligibility
- **RULE**: For a customer return against an existing invoice:
  - Return quantity for any line item cannot exceed the original quantity billed on that invoice:
    $$0 < \text{returnQuantity} \le \text{originalQuantity}$$
  - If `restockable === true`, the returned units are added back into the active batch:
    $$\text{batch.quantity}_{\text{new}} = \text{batch.quantity}_{\text{old}} + \text{returnQuantity}$$
  - A corresponding positive stock movement of type `'Return'` is logged.
- **WHERE IMPLEMENTED**: `returnService.ts` (`createSalesReturn`), `ReturnsPage.tsx`.

### Rule 5.2: Supplier Purchase Return (Debit Note)
- **RULE**: For goods returned to suppliers (e.g., near-expiry, damaged stock, rate discrepancy):
  - Deducts stock from inventory if currently active.
  - Generates a Supplier Debit Note / Purchase Return record.
- **WHERE IMPLEMENTED**: `returnService.ts` (`createPurchaseReturn`), `ReturnsPage.tsx`.
