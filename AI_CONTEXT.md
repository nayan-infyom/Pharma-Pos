# AI_CONTEXT.md

## Project
**Pharma POS (Apex Care Pharmacy Management & Point of Sale System)**

---

## Purpose
A specialized, high-performance, single-store pharmacy retail management application engineered for retail pharmacies, clinical dispensing counters, and medical store operators in India. It handles fast retail billing, batch-level inventory tracking with First-Expiry-First-Out (FEFO) dispensing, Indian GST calculation, customer credit (Khata) ledgers, doctor prescription logging & dispensing, supplier purchase inwarding, and sales/purchase returns.

---

## Product
The Pharma POS is intended to provide:
1. **High-Speed Counter POS Billing**: Sub-second keyboard-driven checkout (`F2` to trigger, `F4` to hold, `F8` to resume, instant barcode/name search, auto-batch selection).
2. **Batch & Expiry Governance**: Strict batch-level inventory tracking, FEFO enforcement, near-expiry (<90d) loss-exposure radars, and expiry alerts.
3. **Prescription-to-Dispense Pipeline**: Direct transfer of doctor prescriptions to the POS cart with automatic dosage/frequency instruction handling.
4. **Regulatory & Tax Accuracy**: Automated HSN/GST (5%, 12%, 18%) calculation, Schedule H drug prescription verification, and drug license / GSTIN invoice headers.
5. **Customer Khata & Supplier Ledgers**: Real-time credit limits, outstanding balances, partial payments, and ledger settlements.

---

## Current Development Phase
**Frontend-Only / Mock-Data & LocalStorage Persistence Phase**
- The application is a fully functional client-side Single Page Application (SPA).
- Data is seeded from initial mock fixtures (`src/data/`) and persists across user sessions via browser `localStorage` wrapped in TypeScript service classes (`src/services/`).
- No live backend API, PostgreSQL database, or remote microservices are currently running.

---

## Technology Stack
- **Framework**: React 19 (`react`, `react-dom`)
- **Build Tool**: Vite 6 (`vite`, `@vitejs/plugin-react`)
- **Language**: TypeScript 5.8 (Strict type checking, `tsc --noEmit`)
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`, `tailwindcss`) — **Light Mode Only**
- **State Management**: Zustand v5 (`zustand`) — `usePOSStore`, `useAppStore`
- **Routing**: React Router DOM v7 (`react-router-dom`)
- **Icons**: Lucide React (`lucide-react`)
- **Charts & Visualizations**: Recharts v3 (`recharts`)
- **Animations**: Motion (`motion/react`)
- **Confetti/Celebration**: `canvas-confetti`
- **Validation / Forms**: `zod`, `react-hook-form` (available in dependencies)

---

## Architecture Overview
The application follows a clean layered frontend architecture:
```
User Interaction
       ↓
React Router Pages (src/pages/*)
       ↓
UI / Feature Components (src/components/*)
       ↓
Zustand State Stores (src/store/*)  &  React Hooks
       ↓
Domain Services (src/services/*)
       ↓
Browser LocalStorage & In-Memory Seed Data (src/data/*)
```

---

## Major Modules
| Module | Route | Primary Responsibility |
|---|---|---|
| **Dashboard** | `/` | Operational Command Center: Live counter shift revenue, cash/UPI splits, triage radar (stockouts, near-expiry, pending Rx, Khata, payables), dispensing velocity charts. |
| **POS Terminal** | `/pos` | Rapid counter billing, barcode scanning, FEFO batch selection, held carts, split payments, Khata credit, thermal/A4 receipt printing. |
| **Sales Invoices** | `/sales` | Invoice ledger, transaction history, customer filtering, payment status, invoice reprint & refund initiation. |
| **Inventory** | `/inventory` | Batch-level ledger, stock movements audit trail, manual stock adjustments (Add/Subtract/Set/Damage/Expiry), expiry monitoring. |
| **Medicines Directory** | `/medicines` | Master drug catalog, generic combinations, Schedule H flags, rack locations, pricing (Cost/MRP/Selling), batch creation. |
| **Purchases (Inward PO)** | `/purchases` | Inward purchase order logging, supplier invoice matching, batch creation upon receipt, stock auto-increment. |
| **Customers (Khata CRM)** | `/customers` | Patient directory, chronic condition & allergy tracking, credit limits, outstanding balance settlements. |
| **Suppliers** | `/suppliers` | Distributor directory, GSTIN, drug license verification, credit terms, payables management. |
| **Prescriptions** | `/prescriptions` | Digital prescription repository, doctor details, diagnosis logging, 1-click **Dispense in POS** action. |
| **Returns** | `/returns` | Customer Sales Returns (refunds + restock) & Supplier Purchase Returns (debit adjustments). |
| **Expenses** | `/expenses` | Store operating expenses (Rent, Cold chain power, Bio-waste disposal, Salaries) with cash/UPI tracking. |
| **Reports** | `/reports` | Financial summaries, gross margins, category share, payment method breakdown, low stock exports. |
| **Employees** | `/employees` | Staff roster, roles (Admin, Chief Pharmacist, Cashier), shift timings, role-based permission tags. |
| **Settings** | `/settings` | Pharmacy store profile, GSTIN/DL numbers, POS receipt preferences, FEFO rules, data export/reset. |

---

## Important Directories
- `/src/components/layout/`: Global navigation (`Sidebar`, `Topbar`, `AppLayout`), `GlobalSearchModal`, `KeyboardShortcutsModal`, `QuickActionModal`, `ToastContainer`.
- `/src/components/pos/`: POS billing components (`BatchSelectorModal`, `CustomerSelectModal`, `PaymentModal`, `CompletedSaleModal`, `HeldSalesDrawer`).
- `/src/components/ui/`: Base design system primitives (`Button`, `Input`, `Select`, `Card`, `Badge`, `Modal`, `Drawer`, `Tabs`, `Skeleton`, `EmptyState`, `Kbd`).
- `/src/data/`: Initial seed data fixtures (`medicines`, `sales`, `purchases`, `customers`, `suppliers`, `prescriptions`, `returns`, `expenses`, `employees`, `stockMovements`, `settings`).
- `/src/pages/`: Page-level route views.
- `/src/services/`: LocalStorage-persisted singleton service layer.
- `/src/store/`: Zustand global stores (`usePOSStore`, `useAppStore`).
- `/src/types/`: Central TypeScript type definitions (`src/types/index.ts`).
- `/src/utils/`: Number, date, currency, and expiry helper utilities (`formatINR`, `formatDate`, `getExpiryStatus`).
- `/.ai/`: Universal AI knowledge base, skills, and workflow playbooks.

---

## State Management
- **`usePOSStore`** (`src/store/usePOSStore.ts`): Holds active POS cart state, selected customer, doctor name, cart discounts, held sales (`pharmapos_held_sales_v1`), payment modal states, and dynamic monetary calculations (Subtotal, GST Tax, Round-off, Grand Total).
- **`useAppStore`** (`src/store/useAppStore.ts`): Holds global UI state: sidebar collapse, mobile sidebar drawer, global search modal (`Ctrl+K`), quick action modal (`Alt+N`), keyboard shortcuts modal (`?`), active employee profile, current store branch, and toast notification queue.
- **Local Page State**: Managed with standard React `useState` / `useEffect` for search filters, tab selection, modal forms, and local drawer views.

---

## Service Layer
All domain actions go through TypeScript singleton services in `src/services/`:
- `medicineService`: Drug catalog, batch CRUD, stock deduction/addition, search.
- `inventoryService`: Stock adjustments, audit movements trail.
- `salesService`: Sales invoice creation, stock deduction trigger, customer Khata update.
- `purchaseService`: Inward PO creation, automatic batch creation, stock increment.
- `customerService`: Customer CRUD, Khata credit/debit, balance settlement.
- `supplierService`: Supplier CRUD, outstanding balance tracking.
- `prescriptionService`: Prescription logging, status lifecycle, POS transfer normalization.
- `returnService`: Sales returns (restock + refund) and purchase returns (debit notes).
- `expenseService`: Operational store expense logging.
- `employeeService`: Staff directory, role permissions.
- `settingsService`: Pharmacy metadata, GST rates, receipt configuration.

---

## Routing Table
- `/` → `DashboardPage`
- `/pos` → `POSPage`
- `/sales` → `SalesPage`
- `/inventory` → `InventoryPage`
- `/medicines` → `MedicinesPage`
- `/purchases` → `PurchasesPage`
- `/customers` → `CustomersPage`
- `/suppliers` → `SuppliersPage`
- `/prescriptions` → `PrescriptionsPage`
- `/returns` → `ReturnsPage`
- `/expenses` → `ExpensesPage`
- `/reports` → `ReportsPage`
- `/employees` → `EmployeesPage`
- `/settings` → `SettingsPage`
- `*` → Redirects to `/`

---

## Key Pharmacy Concepts
- **Batch Tracking**: Every drug unit belongs to a distinct batch with a unique manufacturing date, expiry date, purchase price, MRP, and selling price.
- **FEFO (First Expiry, First Out)**: The batch expiring earliest is automatically selected for sale by default to minimize expired stock wastage.
- **MRP vs. Selling Price**: MRP is the Maximum Retail Price in India; Selling Price can be equal to or discounted from MRP.
- **Schedule H / Prescription Required**: Controlled medicines that require valid prescribing doctor registration details before dispensing.
- **Patient Khata**: Store credit ledger for trusted chronic patients with defined credit limits and repayment records.
- **GST & HSN**: Indian Goods and Services Tax applied at line-item level (5%, 12%, 18%) with invoice breakdowns (CGST + SGST).

---

## Important Business Rules
See [BUSINESS_RULES.md](./BUSINESS_RULES.md) for full specifications on inventory movements, FEFO logic, pricing formulas, and prescription verification.

---

## UX Guidelines
See [UX_GUIDELINES.md](./UX_GUIDELINES.md) for design rules (**Strictly Light Mode Only**, clean neutral aesthetic, high-contrast typography, keyboard navigation).

---

## AI Operating Instructions
See [AGENTS.md](./AGENTS.md) for mandatory rules before, during, and after making any code edits.

---

## Skills Index
See [.ai/SKILLS_INDEX.md](./.ai/SKILLS_INDEX.md) and [.ai/README.md](./.ai/README.md) for dedicated modular AI skills.

---

## Current Limitations
- **Client-Side Storage**: Data is saved to browser `localStorage`. Clearing browser data resets state to initial mock fixtures.
- **Single Branch Operational Scope**: Designed for single counter/branch operation; multi-store inter-branch stock transfers are mock simulated.
- **No Real Hardware Integration**: Barcode scanner input is supported via standard keyboard HID wedge emulation (Enter key triggers); thermal printing triggers standard browser print dialog (`window.print()`).

---

## Future Direction
*(FUTURE — NOT CURRENTLY IMPLEMENTED)*
- A production backend utilizing **Node.js + Express + PostgreSQL** (via Drizzle or Prisma ORM) with JWT authentication, multi-tenant store isolation, GST E-Invoicing API integration, and real-time WebSocket counter sync.
