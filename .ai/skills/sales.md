# .ai/skills/sales.md — Sales Invoices, History & Refund Workflows

This skill guides AI assistants on managing sales invoices, invoice inspection, receipt reprinting, and sales refunds.

---

## 1. Sales Architecture

- **Page View**: `src/pages/SalesPage.tsx` (`/sales`)
- **Service**: `src/services/salesService.ts` (`salesService`)
- **Related Types**: `SaleInvoice`, `CartItem`, `PaymentMethod`, `SalesReturn`

---

## 2. Sales Invoice Generation

When a sale is finalized in the POS terminal, `salesService.createSale()` executes the following atomic steps:
1. Generates sequential invoice code: `INV-YYYY-XXXX` (e.g. `INV-2026-1001`).
2. Iterates over `sale.items`:
   - Calls `medicineService.deductStock(item.medicineId, item.batchId, item.quantity)`.
   - Calls `inventoryService.recordMovement()` with type `'Sale'` and negative quantity.
3. If `sale.customerId` exists and `paymentMethod === 'Credit'`, updates customer Khata balance via `customerService.recordPurchase()`.
4. Saves new invoice to `localStorage` (`pharmapos_sales_v1`).

---

## 3. Invoice Inspection & Thermal Receipt Reprinting

- Clicking any row on `/sales` opens a slide-over inspection drawer.
- The drawer displays:
  - Invoice header: Invoice No., Date, Cashier, Customer info, Prescribing Doctor.
  - Itemized table: Medicine, Batch No., Expiry Date, Quantity, Selling Price, GST Rate, Line Total.
  - Financial summary: Subtotal, Discount, Tax (GST), Round-off, Grand Total, Tendered, Change returned.
  - Action buttons: `Reprint Receipt` (triggers formatted print view) and `Initiate Return` (navigates to `/returns`).

---

## 4. Sales Refund & Return Mechanics

- When a sale is refunded:
  - The invoice status transitions from `'Completed'` to `'Refunded'` or `'Partially Refunded'`.
  - Restockable items trigger `medicineService.addStock()` to restore inventory.
  - An audit trail entry of type `'Return'` is appended to `StockMovement`.
