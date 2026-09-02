# PRODUCT_SPEC.md — Functional Product Specification

This document provides the definitive functional specification for every module within the **Pharma POS** application.

---

## Module Index & Status Matrix

| Module | Route | Status | Primary Users |
|---|---|---|---|
| **Dashboard** | `/` | **IMPLEMENTED** | Pharmacist on Duty, Store Manager |
| **POS Terminal** | `/pos` | **IMPLEMENTED** | Cashier, Counter Pharmacist |
| **Sales Invoices** | `/sales` | **IMPLEMENTED** | Cashier, Accountant, Pharmacist |
| **Inventory** | `/inventory` | **IMPLEMENTED** | Inventory Specialist, Pharmacist |
| **Medicines Catalog** | `/medicines` | **IMPLEMENTED** | Chief Pharmacist, Inventory Manager |
| **Purchases (Inward PO)** | `/purchases` | **IMPLEMENTED** | Purchase Manager, Pharmacist |
| **Customers & Khata CRM** | `/customers` | **IMPLEMENTED** | Cashier, Customer Relations Pharmacist |
| **Suppliers Directory** | `/suppliers` | **IMPLEMENTED** | Purchase Manager, Store Owner |
| **Prescriptions** | `/prescriptions` | **IMPLEMENTED** | Registered Pharmacist (R.Ph) |
| **Returns** | `/returns` | **IMPLEMENTED** | Cashier, Store Manager |
| **Expenses** | `/expenses` | **IMPLEMENTED** | Store Owner, Cashier |
| **Reports & Analytics** | `/reports` | **IMPLEMENTED** | Store Owner, Financial Auditor |
| **Employees & Roles** | `/employees` | **IMPLEMENTED** | Store Owner, Admin |
| **Settings** | `/settings` | **IMPLEMENTED** | Store Admin |

---

## 1. Dashboard (`/`) — Operational Command Center
- **Purpose**: Real-time counter monitoring, live shift revenues, triage radar, and dispensing performance.
- **Primary Users**: Counter Pharmacist, Store Manager.
- **Implementation Status**: **IMPLEMENTED**
- **Main Workflows**:
  - Live Counter Sales tracking with Cash vs. Digital (UPI/Card) breakdown.
  - Triage Radar: Instant tabs for Stockouts, Near-Expiry (<90d), Pending Rx, Overdue Khata Credit, and Supplier Payables.
  - Dispensing Velocity & Gross Profit Trend chart (Today, 7 days, 30 days, 12 months).
  - Quick action triggers (`POS Billing [F2]`, `+ Inward PO`, `+ Log Rx`, `Sync`).
- **Related Services**: `salesService`, `medicineService`, `customerService`, `supplierService`, `prescriptionService`.

---

## 2. Point of Sale (POS) Terminal (`/pos`)
- **Purpose**: Rapid retail dispensing, sub-second checkout, barcode lookup, batch selection, split payments, and receipt generation.
- **Primary Users**: Counter Pharmacist, Cashier.
- **Implementation Status**: **IMPLEMENTED**
- **Main Workflows**:
  - **Item Entry**: Barcode scanning or instant search across brand, generic name, category, and SKU.
  - **Batch Selection**: Defaults to earliest active expiry (FEFO); allows manual batch switching modal.
  - **Cart Management**: Real-time quantity adjustments, line item discounts, and Schedule H prescription warnings.
  - **Customer Selection**: Walk-in by default; search registered patients with chronic conditions and allergy alerts.
  - **Held Sales**: Hold current cart (`F4`), resume later (`F8`), or park multiple carts in local storage.
  - **Checkout / Payment**: Exact cash shortcuts (₹100, ₹200, ₹500, ₹2000), UPI QR simulation, Card, Split payment, or Customer Khata Credit.
  - **Receipt Printing**: Standard thermal 80mm/58mm or A4 invoice formatting with GSTIN, DL numbers, and batch details.
- **Related Services**: `salesService`, `medicineService`, `customerService`, `usePOSStore`.

---

## 3. Sales Invoices (`/sales`)
- **Purpose**: Comprehensive historical ledger of all completed sales, payment statuses, and invoice audit records.
- **Primary Users**: Cashier, Accountant.
- **Implementation Status**: **IMPLEMENTED**
- **Main Workflows**:
  - Filter invoices by date, payment method (Cash, UPI, Card, Credit, Split), or search by customer name/phone/invoice number.
  - Inspect itemized breakdown including batches, GST rates, HSN codes, and cashier info in a dedicated drawer.
  - Instant reprint thermal receipt or trigger sales return for specific line items.
- **Related Services**: `salesService`, `returnService`.

---

## 4. Inventory Management (`/inventory`)
- **Purpose**: Real-time batch-level stock management, FEFO compliance, expiry surveillance, and physical stock audits.
- **Primary Users**: Inventory Specialist, Pharmacist.
- **Implementation Status**: **IMPLEMENTED**
- **Main Workflows**:
  - Master Batch Ledger: View all active, near-expiry, and expired batches with rack locations and stock valuations.
  - Near Expiry Radar: Filter batches expiring in <30, <60, or <90 days with financial loss exposure calculations.
  - Stock Adjustments: Add Stock, Subtract Stock, Set Stock (Physical Audit), Mark Damaged, or Mark Expired.
  - Stock Movements Audit Log: Complete chronological ledger of stock movements (Purchase, Sale, Return, Adjustment, Damage, Expiry).
- **Related Services**: `inventoryService`, `medicineService`.

---

## 5. Medicines Catalog (`/medicines`)
- **Purpose**: Master pharmaceutical catalog managing drug formulations, strengths, pack sizes, pricing, and batch creation.
- **Primary Users**: Chief Pharmacist, Inventory Manager.
- **Implementation Status**: **IMPLEMENTED**
- **Main Workflows**:
  - Drug Catalog CRUD: Add/edit medicines with generic names, brand, category, dosage form, strength, pack size, barcode, HSN, and GST %.
  - Batch Management: Add new batches under a specific medicine with supplier details, manufacturing date, and expiry date.
  - Schedule H & Storage Instructions configuration.
- **Related Services**: `medicineService`, `supplierService`.

---

## 6. Purchases (Inward PO) (`/purchases`)
- **Purpose**: Procurement management, supplier invoice inwarding, batch creation, and cost tracking.
- **Primary Users**: Purchase Manager, Pharmacist.
- **Implementation Status**: **IMPLEMENTED**
- **Main Workflows**:
  - Create Inward Purchase Orders with multi-item batch details, free quantities (bonus schemes), purchase price, and MRP.
  - Marking an order as "Received" automatically increments medicine inventory and creates/updates batch records.
  - Filter orders by supplier, status (Received, Ordered, Cancelled), and payment status (Paid, Pending, Partial).
- **Related Services**: `purchaseService`, `medicineService`, `inventoryService`, `supplierService`.

---

## 7. Customers & Patient Khata CRM (`/customers`)
- **Purpose**: Patient profiles, chronic disease tracking, allergy warnings, loyalty points, and Khata store credit ledger.
- **Primary Users**: Cashier, Pharmacist.
- **Implementation Status**: **IMPLEMENTED**
- **Main Workflows**:
  - Add and edit customer records with phone, address, age, gender, allergies, and chronic conditions.
  - View purchase history and active outstanding Khata balance.
  - **Khata Settlement**: Modal to receive partial or full balance repayments via Cash, UPI, or Card.
- **Related Services**: `customerService`.

---

## 8. Suppliers Directory (`/suppliers`)
- **Purpose**: Pharmaceutical distributor contacts, GSTIN/DL numbers, payment terms, and outstanding payables.
- **Primary Users**: Purchase Manager, Store Owner.
- **Implementation Status**: **IMPLEMENTED**
- **Main Workflows**:
  - Maintain distributor profiles with contact person, phone, email, GSTIN, DL number, and credit days.
  - Track total purchases and outstanding payables.
- **Related Services**: `supplierService`.

---

## 9. Prescriptions (`/prescriptions`)
- **Purpose**: Digital repository for doctor prescriptions, clinical diagnosis tracking, and direct POS dispensing.
- **Primary Users**: Registered Pharmacist.
- **Implementation Status**: **IMPLEMENTED**
- **Main Workflows**:
  - Log new prescription with patient details, doctor registration number, diagnosis, and itemized regimen (dosage, duration, timing).
  - **1-Click POS Dispense**: Loads all prescribed medicines directly into the POS cart, applies dosage instructions, and sets status to "Dispensed".
- **Related Services**: `prescriptionService`, `customerService`, `medicineService`, `usePOSStore`.

---

## 10. Returns & Refunds (`/returns`)
- **Purpose**: Handling customer sales returns (with inventory restock) and supplier purchase returns (debit notes).
- **Primary Users**: Cashier, Store Manager.
- **Implementation Status**: **IMPLEMENTED**
- **Main Workflows**:
  - Customer Sales Returns: Select original invoice, pick items and return quantities, choose refund method (Cash / Credit Note), and restock inventory.
  - Supplier Purchase Returns: Debit return for near-expiry, damaged, or excess goods.
- **Related Services**: `returnService`, `medicineService`, `inventoryService`.

---

## 11. Expenses (`/expenses`)
- **Purpose**: Tracking day-to-day pharmacy operating overheads (rent, cold chain electricity, bio-waste disposal, salaries).
- **Primary Users**: Store Owner, Cashier.
- **Implementation Status**: **IMPLEMENTED**
- **Main Workflows**:
  - Record expense entries with category, amount, payment method, receipt number, and notes.
  - Category summaries and monthly expense totals.
- **Related Services**: `expenseService`.

---

## 12. Reports & Analytics (`/reports`)
- **Purpose**: Financial performance, gross margins, payment breakdowns, category distribution, and exportable audit summaries.
- **Primary Users**: Store Owner, Auditor.
- **Implementation Status**: **IMPLEMENTED**
- **Main Workflows**:
  - Real-time revenue and margin calculation (Blended Gross Profit %).
  - Recharts visual charts: Monthly revenue vs. expense, Sales by category pie chart, Payment method breakdown.
  - Quick export triggers for sales and inventory summaries.
- **Related Services**: `salesService`, `expenseService`, `medicineService`.

---

## 13. Employees & Permissions (`/employees`)
- **Purpose**: Pharmacist and cashier staff roster, shift timings, and role-based capability tags.
- **Primary Users**: Store Owner, Admin.
- **Implementation Status**: **IMPLEMENTED**
- **Main Workflows**:
  - View employee roster with roles (Admin, Chief Pharmacist, Staff Pharmacist, Cashier, Inventory Specialist).
  - Inspect role permission tags (`all`, `pos`, `rx`, `inventory`, `manage_settings`).
- **Related Services**: `employeeService`, `useAppStore`.

---

## 14. Settings (`/settings`)
- **Purpose**: Pharmacy identity configuration, tax defaults, receipt printing options, and data backup/reset.
- **Primary Users**: Store Admin.
- **Implementation Status**: **IMPLEMENTED**
- **Main Workflows**:
  - Store Profile: Name, address, GSTIN, DL 20B/21B, FSSAI numbers.
  - POS Configuration: Default GST rates, thermal receipt width (58mm / 80mm / A4), FEFO auto-suggestion toggle, round-off preferences.
  - Inventory Settings: Low stock alert threshold, expiry warning day windows (30d, 60d, 90d).
  - Backup & Reset: Export entire store JSON backup or reset local storage to seed defaults.
- **Related Services**: `settingsService`.

---

## 15. Planned Features (FUTURE — NOT CURRENTLY IMPLEMENTED)
- Multi-branch stock transfer protocols with transit tracking.
- Direct Indian Govt GST Portal E-Invoice and E-Way bill API push.
- SMS / WhatsApp Gateway integration for instant patient receipt delivery.
- AI-based demand forecasting for seasonal epidemic drug requirements.
- Full server-backed PostgreSQL relational database with multi-user concurrency control.
