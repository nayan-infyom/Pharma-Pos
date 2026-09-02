# PROJECT_STATUS.md — Project Roadmap & Implementation Audit

This document details the **factual, verified state of the Pharma POS application**. It distinguishes between implemented features, partial implementations, known limitations, and future roadmaps.

---

## 1. Current Development Phase
- **Current Phase**: **Phase 1 — Frontend-Only SPA with LocalStorage Persistence**
- **Runtime Environment**: React 19 + Vite 6 + Tailwind CSS v4 running entirely in the browser client.
- **Persistence Mechanism**: Browser `localStorage` wrapping in-memory seed data fixtures (`src/data/*`).

---

## 2. Implemented Modules (100% Functional)

| Module | Verification Notes |
|---|---|
| **Dashboard (`/`)** | Operational KPI cards (Today Sales, Transactions, Khata Balance, Near Expiry), 5 triage radar tabs with filtering, Dispensing Velocity Recharts trend, and fast action triggers. |
| **POS Terminal (`/pos`)** | Real-time drug search, barcode auto-selection, FEFO batch assignment, batch switcher modal, patient Khata selector with allergy alerts, cart discounts, held sales management (`F4`/`F8`), exact cash tender shortcuts, UPI/Split/Credit payment flows, completed invoice modal with thermal receipt rendering. |
| **Sales Invoices (`/sales`)** | Paginated invoice table, search by invoice#/patient/phone, payment method filters, itemized inspection drawer with batch-level breakdown, refund trigger, thermal receipt reprint. |
| **Inventory Ledger (`/inventory`)** | Master batch table with rack locations, Near-Expiry loss calculator (<30d, <60d, <90d), stock audit adjustments (Add, Subtract, Set, Damage, Expiry), and immutable stock movements audit trail. |
| **Medicines Catalog (`/medicines`)** | Master catalog view with category filters, generic salt search, Schedule H indicators, stock levels, add/edit drug modal, and new batch creation modal. |
| **Purchases / Inward PO (`/purchases`)** | Inward purchase order logger with supplier selection, batch numbers, manufacturing/expiry dates, bonus free quantities, purchase prices, and automatic stock inwarding upon "Received" status. |
| **Customers & Khata CRM (`/customers`)** | Patient records with chronic conditions, drug allergies, credit limits, outstanding balances, lifetime spend, purchase history drawer, and debt settlement modal. |
| **Suppliers Directory (`/suppliers`)** | Distributor database with contact details, GSTIN, Drug License numbers, credit terms, and outstanding payables tracker. |
| **Prescriptions (`/prescriptions`)** | Doctor prescription logger with patient info, doctor registration number, diagnosis, multi-drug regimen, and **1-click Transfer to POS Cart** with automatic status update. |
| **Returns (`/returns`)** | Sales returns against original invoice with restockable batch increment and refund recording; Purchase returns for supplier debit notes. |
| **Expenses (`/expenses`)** | Operating overhead logger (Rent, Cold chain power, Bio-waste, Salaries) with category breakdowns and payment method tagging. |
| **Reports (`/reports`)** | Gross profit %, monthly revenue vs. expense charts, category sales distribution pie charts, payment method breakdown, and data export triggers. |
| **Employees & Permissions (`/employees`)** | Staff roster, roles (Admin, Pharmacist, Cashier), shift timings, and permission capabilities. |
| **Settings (`/settings`)** | Pharmacy business profile (GSTIN, DL 20B/21B, FSSAI), POS receipt layout preferences (58mm, 80mm, A4), expiry alert thresholds, full JSON store backup download, and store reset. |
| **Global Navigation & Modals** | Global Quick Action (`Alt+N`), Global Search (`Ctrl+K`), Keyboard Shortcuts Reference (`?`), and dynamic Toast notification stack. |

---

## 3. Partially Implemented / Simulated Capabilities

- **Thermal Receipt Printing**: Uses standard browser `window.print()` targeting formatted HTML receipt layouts rather than raw ESC/POS binary socket connections.
- **Barcode Scanning**: Implemented using standard keyboard buffer input (scanners configured in Keyboard Wedge mode that terminate with `Enter`).
- **Data Export**: Implemented as client-side JSON/CSV export files triggered via browser download.

---

## 4. Known Limitations & Technical Constraints

1. **Browser Storage Limits**: Data is stored in browser `localStorage`. Exceeding browser quota (~5MB) in high-volume testing could cause serialization errors. Clearing browser cookies/cache resets data to defaults.
2. **Single-Device State**: Changes made on one browser/device do not automatically synchronize to another workstation in real time without a central backend.
3. **No Hardware Cash Drawer Trigger**: Standard web browsers cannot send raw RJ12 electric pulses to kick open physical cash drawers without a native Electron or local hardware bridge service.

---

## 5. Future Direction (PLANNED — NOT CURRENTLY IMPLEMENTED)

- **Backend Architecture**:
  - Runtime: Node.js with Express & TypeScript
  - Database: PostgreSQL (with Drizzle ORM or Prisma)
  - Security: JWT-based stateless session authentication and role-based access control (RBAC)
  - API: RESTful endpoints with OpenAPI / Swagger documentation
- **Hardware Integration**:
  - Dedicated lightweight local bridge (WebSocket / WebHID / WebUSB) for ESC/POS thermal printers, weighing scales, and cash drawer triggers.
- **Government Compliance Integration**:
  - Direct integration with Indian GST e-Invoicing API and E-Way Bill generation.
