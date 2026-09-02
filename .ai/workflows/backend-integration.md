# .ai/workflows/backend-integration.md — Future Backend Architecture & Transition Playbook

> **CRITICAL NOTE**: This architecture is **FUTURE — NOT CURRENTLY IMPLEMENTED**. The current application is a frontend-only React SPA backed by LocalStorage services. This guide documents the planned migration strategy to a Node.js + Express + PostgreSQL backend.

---

## 1. Target Architecture Overview

```mermaid
flowchart TD
    subgraph Frontend [React 19 Frontend SPA]
        UI[UI Components & Pages]
        ST[Zustand Stores / React Query]
        API_CLIENT[API Client Layer /src/services/api.ts]
    end

    subgraph Backend [Node.js + Express Server (/server.ts or /api/*)]
        ROUTER[Express REST Router]
        AUTH_MW[JWT Auth Middleware & RBAC]
        VAL_MW[Zod Request Validation Middleware]
        CTRL[Domain Controllers (Sales, Inventory, Rx)]
        ORM[Drizzle ORM / Prisma Client]
    end

    subgraph Database [PostgreSQL Database]
        PG[(PostgreSQL 16 Tables & Constraints)]
    end

    UI --> ST
    ST --> API_CLIENT
    API_CLIENT -->|HTTP REST / JSON / JWT| ROUTER
    ROUTER --> AUTH_MW
    AUTH_MW --> VAL_MW
    VAL_MW --> CTRL
    CTRL --> ORM
    ORM --> PG
```

---

## 2. Service-to-API Layer Transition Strategy

The existing singleton services (`medicineService`, `salesService`, `customerService`, `inventoryService`, etc.) provide a clean abstraction boundary. During backend migration:

1. **Replace LocalStorage Reads/Writes with Async HTTP Calls**:
   ```typescript
   // CURRENT (LocalStorage):
   async getAll(): Promise<Medicine[]> {
     return [...this.medicines];
   }

   // FUTURE (REST API):
   async getAll(): Promise<Medicine[]> {
     const res = await fetch('/api/medicines', { headers: this.getAuthHeaders() });
     if (!res.ok) throw new Error('Failed to fetch medicines');
     return res.json();
   }
   ```
2. **Preserve UI Component Interfaces**:
   - Because all page components already consume asynchronous service promises (`await medicineService.getAll()`), the UI layer requires minimal refactoring.
3. **Handle Server Loading & Error States**:
   - Introduce React Query (`@tanstack/react-query`) or SWR for caching, background revalidation, and optimistic mutations.

---

## 3. Database Schema Mapping (PostgreSQL)

Future PostgreSQL tables will map directly to the TypeScript types defined in `DATA_MODEL.md`:
- `medicines`: Core drug catalog, HSN, generic name, category, schedule H flag.
- `batches`: Inventory lots linked by foreign key `medicine_id REFERENCES medicines(id)` with `CHECK (quantity >= 0)`.
- `sales_invoices`: Header records with `invoice_number UNIQUE`, `cashier_id`, `grand_total`, `payment_method`.
- `sale_items`: Line items with foreign keys to `sales_invoices(id)`, `medicines(id)`, and `batches(id)`.
- `customers`: Patient profiles, `outstanding_balance`, `allergies`, `chronic_conditions`.
- `stock_movements`: Immutable append-only audit log with `type`, `quantity_change`, and `reference_id`.
- `prescriptions`: Digital prescriptions and `prescription_items`.
- `purchase_orders` & `purchase_items`: Inward procurement logs.
- `expenses`: Operating overheads ledger.

---

## 4. Transactional Invariants in Backend
In a relational database, multi-step operations (such as POS checkout) **MUST** be wrapped in atomic database transactions:
```sql
BEGIN;
  -- 1. Insert Sales Invoice
  INSERT INTO sales_invoices (...) VALUES (...);
  -- 2. Insert Sale Items
  INSERT INTO sale_items (...) VALUES (...);
  -- 3. Atomically Deduct Batch Stock
  UPDATE batches SET quantity = quantity - $sold_qty WHERE id = $batch_id AND quantity >= $sold_qty;
  -- 4. Insert Stock Movement
  INSERT INTO stock_movements (...) VALUES (...);
  -- 5. Update Customer Khata Balance (if credit sale)
  UPDATE customers SET outstanding_balance = outstanding_balance + $grand_total WHERE id = $customer_id;
COMMIT;
```
