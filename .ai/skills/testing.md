# .ai/skills/testing.md — Verification, Type Safety & Regression Testing

This skill guides AI assistants on validating code modifications, executing TypeScript type checks, verifying critical user flows, and preventing regressions.

---

## 1. Automated Verification Commands

Before concluding any development turn:
1. **TypeScript Typecheck**:
   ```bash
   npm run lint
   # Executes: tsc --noEmit
   ```
   *Expectation*: Zero errors, zero warnings.
2. **Production Bundle Build**:
   ```bash
   npm run build
   # Executes: vite build
   ```
   *Expectation*: Build succeeds and outputs static assets to `dist/`.

---

## 2. Core Functional Test Scenarios

### Scenario A: POS Checkout Workflow
1. Navigate to `/pos`.
2. Type medicine name or scan barcode $\rightarrow$ Verify drug appears and earliest expiring batch is selected.
3. Modify item quantity $\rightarrow$ Verify quantity is clamped to batch limit, line total and cart tax update accurately.
4. Select registered customer $\rightarrow$ Verify customer name, allergy badges, and Khata balance display.
5. Press `F2` $\rightarrow$ Verify Payment Modal opens with correct Grand Total.
6. Enter Cash amount $\rightarrow$ Verify change calculation is accurate.
7. Click "Finalize Sale" $\rightarrow$ Verify Completed Sale Modal opens, receipt is rendered, and active cart is cleared.
8. Navigate to `/sales` $\rightarrow$ Verify new invoice appears in list.
9. Navigate to `/inventory` $\rightarrow$ Verify stock for that batch has decreased by sold quantity and stock movement is logged.

### Scenario B: Customer Khata (Credit) Sale & Settlement
1. In POS, select a customer with an active Khata account.
2. In Payment Modal, choose `PaymentMethod = 'Credit'` $\rightarrow$ Finalize sale.
3. Navigate to `/customers` $\rightarrow$ Verify customer's `outstandingBalance` has increased by exact invoice total.
4. Click "Settle Balance" $\rightarrow$ Enter partial repayment (e.g. ₹500) $\rightarrow$ Confirm.
5. Verify `outstandingBalance` decrements by ₹500.

### Scenario C: Prescription-to-POS Dispensing
1. Navigate to `/prescriptions`.
2. Locate a pending prescription and click **"Dispense in POS"**.
3. Verify automatic navigation to `/pos` with:
   - Prescribed medicines populated in the cart with requested quantities.
   - Patient pre-selected.
   - Doctor name pre-filled.
4. Verify prescription status changes to `'Dispensed'`.

### Scenario D: Sales Return & Restock
1. Navigate to `/returns`.
2. Click **"+ New Sales Return"**.
3. Select an existing invoice $\rightarrow$ Enter return quantity $\le$ billed quantity.
4. Select `restockable = true` and choose `Cash` refund.
5. Confirm return $\rightarrow$ Verify refund amount and verify batch stock in `/inventory` is restored by return quantity.
