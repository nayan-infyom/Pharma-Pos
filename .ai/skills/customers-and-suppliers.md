# .ai/skills/customers-and-suppliers.md — Customer Khata CRM & Supplier Relations

This skill covers customer profile management, allergy/chronic alerts, store credit (Khata) ledgers, debt settlement, and supplier distributor records.

---

## 1. Customers & Patient Khata CRM

### Architecture
- **Page View**: `src/pages/CustomersPage.tsx` (`/customers`)
- **Service**: `src/services/customerService.ts` (`customerService`)
- **Key Fields**: `phone`, `loyaltyPoints`, `creditLimit`, `outstandingBalance`, `allergies`, `chronicConditions`.

### Khata (Credit) Lifecycle
1. **Credit Sale**: When a customer completes a sale with `PaymentMethod = 'Credit'`:
   $$\text{outstandingBalance}_{\text{new}} = \text{outstandingBalance}_{\text{old}} + \text{sale.grandTotal}$$
2. **Khata Settlement**:
   - Cashier clicks **"Settle Balance"** in customer drawer or table.
   - Cashier enters payment amount (Cash / UPI / Card).
   - System updates:
     $$\text{outstandingBalance}_{\text{new}} = \max(0, \text{outstandingBalance}_{\text{old}} - \text{paymentAmount})$$

### Clinical Warnings in POS
- If `customer.allergies` has items (e.g. `['Penicillin', 'Sulfa']`), a warning chip appears in the POS Customer Card.
- If `customer.chronicConditions` exists (e.g. `['Type 2 Diabetes', 'Hypertension']`), chronic badges assist the pharmacist in checking for contraindications.

---

## 2. Suppliers Directory

### Architecture
- **Page View**: `src/pages/SuppliersPage.tsx` (`/suppliers`)
- **Service**: `src/services/supplierService.ts` (`supplierService`)
- **Key Fields**: `name`, `contactPerson`, `phone`, `email`, `gstin`, `drugLicense`, `creditDays`, `outstandingAmount`, `totalPurchases`.

### Payables Governance
- When a purchase order is created with `paymentStatus = 'Pending'`, `supplier.outstandingAmount` is tracked.
- When supplier payments are made, `outstandingAmount` decreases accordingly.
