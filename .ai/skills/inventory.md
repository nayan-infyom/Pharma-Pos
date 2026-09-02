# .ai/skills/inventory.md — Inventory, Batches & FEFO Governance

This skill provides comprehensive instructions on batch tracking, FEFO enforcement, stock movements, and audit adjustments.

---

## 1. Inventory Architecture

- **Page View**: `src/pages/InventoryPage.tsx` (`/inventory`)
- **Services**:
  - `src/services/inventoryService.ts` (`inventoryService`)
  - `src/services/medicineService.ts` (`medicineService`)
- **Primary Data Entities**: `Medicine`, `Batch`, `StockMovement`, `StockAdjustment`.

---

## 2. FEFO (First-Expiry-First-Out) Mechanics

When selecting stock lots for dispensing:
1. Filter medicine batches where `quantity > 0` and `status !== 'Expired'`.
2. Compute `daysUntilExpiry = Math.ceil((new Date(batch.expiryDate).getTime() - Date.now()) / (1000 * 3600 * 24))`.
3. Discard any lot where `daysUntilExpiry <= 0`.
4. Sort remaining lots ascending:
   $$\text{Batch A} < \text{Batch B} \iff \text{expiryDate}_A < \text{expiryDate}_B$$
5. Pick the first index.

---

## 3. Stock Adjustment Types

The inventory management interface supports 5 explicit adjustment operations:
1. **Add Stock**: Unscheduled inward stock discovery (+ quantity).
2. **Subtract Stock**: Unscheduled reduction or shrinkage (- quantity).
3. **Set Stock (Audit)**: Physical shelf count override (calculates delta: $\Delta = \text{auditCount} - \text{prevStock}$).
4. **Mark Damaged**: Removes stock and marks movement type as `'Damaged'`.
5. **Mark Expired**: Quarantines expired stock and marks movement type as `'Expired'`.

---

## 4. Immutable Audit Ledger
Every inventory mutation **MUST** call `inventoryService.recordMovement`:
```typescript
await inventoryService.recordMovement({
  medicineId,
  medicineName,
  batchNumber,
  type: 'Purchase' | 'Sale' | 'Return' | 'Adjustment' | 'Expired' | 'Damaged',
  quantityChange, // e.g. -2 for sale, +10 for purchase
  previousStock,
  newStock,
  user: currentUser.name,
  referenceId: invoiceNumber || poNumber || 'MANUAL-ADJ',
  notes
});
```

---

## 5. AI Invariants
- **NEVER** modify batch quantities without updating the parent `medicine.totalStock`.
- **NEVER** delete historical `StockMovement` records during normal operation.
