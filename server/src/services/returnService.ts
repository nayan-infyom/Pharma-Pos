import mongoose from 'mongoose';
import { Medicine } from '../models/Medicine.model';
import { Sale } from '../models/Sale.model';
import { PurchaseOrder } from '../models/PurchaseOrder.model';
import { SalesReturn, SalesReturnDoc } from '../models/SalesReturn.model';
import { PurchaseReturn, PurchaseReturnDoc } from '../models/PurchaseReturn.model';
import { StockMovement } from '../models/StockMovement.model';
import { Customer } from '../models/Customer.model';
import { CustomerLedgerEntry } from '../models/CustomerLedgerEntry.model';
import { Supplier } from '../models/Supplier.model';
import { SupplierLedgerEntry } from '../models/SupplierLedgerEntry.model';
import { AppError } from '../errors/AppError';
import { atomicAddBatchStock, atomicDeductBatchStock } from './stockMutation';
import { nextSequence } from '../models/Counter.model';
import { auditLog } from '../utils/auditLog';
import { buildPagination, Pagination } from '../utils/response';
import { CreatePurchaseReturnBody, CreateSalesReturnBody } from '../validators/return.validators';

export interface ReturnActor {
  employeeId: string;
  name: string;
}

// ---------------------------------------------------------------------------
// Sales Returns
// ---------------------------------------------------------------------------

export async function createSalesReturn(input: CreateSalesReturnBody, actor: ReturnActor): Promise<SalesReturnDoc> {
  const session = await mongoose.startSession();
  try {
    let created!: SalesReturnDoc;

    await session.withTransaction(async () => {
      const sale = await Sale.findById(input.originalSaleId).session(session);
      if (!sale) throw AppError.notFound('Original sale');

      // BUSINESS_RULES.md Rule 5.1: returnQuantity for any line can never
      // exceed what was actually billed on that line, net of anything
      // already returned against it (existing SalesReturn records are the
      // source of truth for "already returned", not a cached counter).
      const alreadyReturned = await SalesReturn.aggregate([
        { $match: { originalSaleId: sale._id } },
        { $unwind: '$items' },
        { $group: { _id: { medicineId: '$items.medicineId', batchNumber: '$items.batchNumber' }, qty: { $sum: '$items.returnQuantity' } } }
      ]).session(session);
      const returnedMap = new Map<string, number>(alreadyReturned.map((r) => [`${r._id.medicineId}:${r._id.batchNumber}`, r.qty]));

      const resolvedItems: {
        medicineId: string;
        medicineName: string;
        batchNumber: string;
        returnQuantity: number;
        unitPrice: number;
        refundAmount: number;
        reason: string;
      }[] = [];
      const movements: { medicineId: string; medicineName: string; batchNumber: string; batchId: string; quantityChange: number }[] = [];

      for (const item of input.items) {
        const saleLine = sale.items.find((li) => li.medicineId.toString() === item.medicineId && li.batchNumber === item.batchNumber);
        if (!saleLine) {
          throw AppError.validation(`Medicine/batch ${item.batchNumber} was not part of the original sale ${sale.invoiceNumber}`);
        }

        const key = `${item.medicineId}:${item.batchNumber}`;
        const already = returnedMap.get(key) ?? 0;
        if (already + item.returnQuantity > saleLine.quantity) {
          throw AppError.validation(
            `Cannot return ${item.returnQuantity} of ${saleLine.medicineName} (batch ${item.batchNumber}): ${saleLine.quantity} were sold and ${already} already returned`
          );
        }

        const medicine = await Medicine.findById(item.medicineId).session(session);
        if (!medicine) throw AppError.notFound(`Medicine ${item.medicineId}`);
        const batch = medicine.batches.find((b) => b.batchNumber === item.batchNumber);
        if (!batch) {
          // The old frontend silently skipped restocking when the batch
          // couldn't be found, leaving a refund record with no matching
          // stock movement. Rejecting outright is the fix — a return that
          // doesn't actually restock is a data-integrity violation, not a
          // legitimate no-op.
          throw AppError.notFound(`Batch ${item.batchNumber} for ${saleLine.medicineName}`);
        }

        const refundAmount = Math.round(item.returnQuantity * saleLine.unitPrice * 100) / 100;
        resolvedItems.push({
          medicineId: item.medicineId,
          medicineName: saleLine.medicineName,
          batchNumber: item.batchNumber,
          returnQuantity: item.returnQuantity,
          unitPrice: saleLine.unitPrice,
          refundAmount,
          reason: item.reason
        });
        movements.push({
          medicineId: item.medicineId,
          medicineName: saleLine.medicineName,
          batchNumber: item.batchNumber,
          batchId: batch._id.toString(),
          quantityChange: item.returnQuantity
        });
      }

      const totalRefundAmount = resolvedItems.reduce((s, i) => s + i.refundAmount, 0);
      const seq = await nextSequence('sales-return', session);
      const returnNumber = `SR-${new Date().getFullYear()}-${seq}`;

      for (const m of movements) {
        const result = await atomicAddBatchStock(session, m.medicineId, m.batchId, m.quantityChange);
        await StockMovement.create(
          [
            {
              medicineId: m.medicineId,
              medicineName: m.medicineName,
              batchNumber: m.batchNumber,
              type: 'Return',
              quantityChange: m.quantityChange,
              previousStock: result.previousBatchQuantity,
              newStock: result.newBatchQuantity,
              user: actor.name,
              referenceId: returnNumber,
              notes: `Sales Return against ${sale.invoiceNumber}`
            }
          ],
          { session }
        );
      }

      const [salesReturn] = await SalesReturn.create(
        [
          {
            returnNumber,
            originalSaleId: sale._id,
            originalInvoiceNumber: sale.invoiceNumber,
            customerId: sale.customerId,
            customerName: sale.customerName,
            items: resolvedItems,
            totalRefundAmount,
            refundMethod: input.refundMethod,
            processedBy: actor.employeeId,
            notes: input.notes
          }
        ],
        { session }
      );

      // 'Credit Note' applies the refund against the customer's Khata,
      // using the exact same applied-amount/floor-at-zero discipline as
      // customerService.settleCustomerBalance (ReturnCredit gets its first
      // write path here, per the deferred decision explicitly earmarking
      // this workflow). Cash/Original Payment refunds never touch Khata.
      if (input.refundMethod === 'Credit Note' && sale.customerId) {
        const customer = await Customer.findById(sale.customerId).session(session);
        if (customer) {
          const appliedAmount = Math.min(totalRefundAmount, customer.outstandingBalance);
          if (appliedAmount > 0) {
            const updated = await Customer.findByIdAndUpdate(
              customer._id,
              { $inc: { outstandingBalance: -appliedAmount } },
              { new: true, session }
            );
            await CustomerLedgerEntry.create(
              [
                {
                  customerId: customer._id,
                  type: 'ReturnCredit',
                  amount: -appliedAmount,
                  balanceAfter: updated!.outstandingBalance,
                  referenceId: returnNumber
                }
              ],
              { session }
            );
          }
        }
      }

      created = salesReturn;
    });

    auditLog('sales_return', {
      returnNumber: created.returnNumber,
      originalInvoiceNumber: created.originalInvoiceNumber,
      employeeId: actor.employeeId,
      totalRefundAmount: created.totalRefundAmount
    });

    return created;
  } finally {
    await session.endSession();
  }
}

export async function listSalesReturns(page: number, limit: number): Promise<{ items: SalesReturnDoc[]; pagination: Pagination }> {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    SalesReturn.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    SalesReturn.countDocuments()
  ]);
  return { items, pagination: buildPagination(page, limit, total) };
}

export async function getSalesReturnById(id: string): Promise<SalesReturnDoc> {
  const doc = await SalesReturn.findById(id);
  if (!doc) throw AppError.notFound('Sales return');
  return doc;
}

// ---------------------------------------------------------------------------
// Purchase Returns
// ---------------------------------------------------------------------------

export async function createPurchaseReturn(input: CreatePurchaseReturnBody, actor: ReturnActor): Promise<PurchaseReturnDoc> {
  const session = await mongoose.startSession();
  try {
    let created!: PurchaseReturnDoc;

    await session.withTransaction(async () => {
      const po = await PurchaseOrder.findById(input.purchaseOrderId).session(session);
      if (!po) throw AppError.notFound('Original purchase order');

      const alreadyReturned = await PurchaseReturn.aggregate([
        { $match: { purchaseOrderId: po._id } },
        { $unwind: '$items' },
        { $group: { _id: { medicineId: '$items.medicineId', batchNumber: '$items.batchNumber' }, qty: { $sum: '$items.quantity' } } }
      ]).session(session);
      const returnedMap = new Map<string, number>(alreadyReturned.map((r) => [`${r._id.medicineId}:${r._id.batchNumber}`, r.qty]));

      const resolvedItems: {
        medicineId: string;
        medicineName: string;
        batchNumber: string;
        quantity: number;
        purchasePrice: number;
        totalAmount: number;
        reason: string;
      }[] = [];
      const movements: { medicineId: string; medicineName: string; batchNumber: string; batchId: string; quantity: number }[] = [];

      for (const item of input.items) {
        const poLine = po.items.find((li) => li.medicineId.toString() === item.medicineId && li.batchNumber === item.batchNumber);
        if (!poLine) {
          throw AppError.validation(`Medicine/batch ${item.batchNumber} was not part of purchase order ${po.invoiceNumber}`);
        }

        const key = `${item.medicineId}:${item.batchNumber}`;
        const already = returnedMap.get(key) ?? 0;
        const originallyReceived = poLine.quantity + poLine.freeQuantity;
        if (already + item.quantity > originallyReceived) {
          throw AppError.validation(
            `Cannot return ${item.quantity} of ${poLine.medicineName} (batch ${item.batchNumber}): only ${originallyReceived} were received and ${already} already returned`
          );
        }

        const medicine = await Medicine.findById(item.medicineId).session(session);
        if (!medicine) throw AppError.notFound(`Medicine ${item.medicineId}`);
        const batch = medicine.batches.find((b) => b.batchNumber === item.batchNumber);
        if (!batch) throw AppError.notFound(`Batch ${item.batchNumber} for ${poLine.medicineName}`);

        const totalAmount = Math.round(item.quantity * poLine.purchasePrice * 100) / 100;
        resolvedItems.push({
          medicineId: item.medicineId,
          medicineName: poLine.medicineName,
          batchNumber: item.batchNumber,
          quantity: item.quantity,
          purchasePrice: poLine.purchasePrice,
          totalAmount,
          reason: item.reason
        });
        movements.push({
          medicineId: item.medicineId,
          medicineName: poLine.medicineName,
          batchNumber: item.batchNumber,
          batchId: batch._id.toString(),
          quantity: item.quantity
        });
      }

      const totalAmount = resolvedItems.reduce((s, i) => s + i.totalAmount, 0);
      const seq = await nextSequence('purchase-return', session);
      const returnNumber = `PR-${new Date().getFullYear()}-${seq}`;

      for (const m of movements) {
        // No enforceNotExpired — 'Near Expiry Received' is a documented
        // reason for a purchase return, so this must be able to act on
        // expired stock (same reasoning as inventory adjustments, Phase E).
        const result = await atomicDeductBatchStock(session, m.medicineId, m.batchId, m.quantity);
        await StockMovement.create(
          [
            {
              medicineId: m.medicineId,
              medicineName: m.medicineName,
              batchNumber: m.batchNumber,
              type: 'Return',
              quantityChange: -m.quantity,
              previousStock: result.previousBatchQuantity,
              newStock: result.newBatchQuantity,
              user: actor.name,
              referenceId: returnNumber,
              notes: `Purchase Return to ${po.supplierName} against ${po.invoiceNumber}`
            }
          ],
          { session }
        );
      }

      const [purchaseReturn] = await PurchaseReturn.create(
        [
          {
            returnNumber,
            purchaseOrderId: po._id,
            purchaseInvoiceNumber: po.invoiceNumber,
            supplierId: po.supplierId,
            supplierName: po.supplierName,
            items: resolvedItems,
            totalAmount,
            status: input.status,
            notes: input.notes
          }
        ],
        { session }
      );

      // A debit note always reduces what the pharmacy owes the supplier,
      // floored at 0 — same applied-amount discipline as every other ledger
      // write in this project. PurchaseReturnDebit gets its first write path
      // here.
      const supplier = await Supplier.findById(po.supplierId).session(session);
      if (supplier && supplier.outstandingAmount > 0) {
        const appliedAmount = Math.min(totalAmount, supplier.outstandingAmount);
        const updated = await Supplier.findByIdAndUpdate(
          supplier._id,
          { $inc: { outstandingAmount: -appliedAmount } },
          { new: true, session }
        );
        await SupplierLedgerEntry.create(
          [
            {
              supplierId: supplier._id,
              type: 'PurchaseReturnDebit',
              amount: -appliedAmount,
              balanceAfter: updated!.outstandingAmount,
              referenceId: returnNumber
            }
          ],
          { session }
        );
      }

      created = purchaseReturn;
    });

    auditLog('purchase_return', {
      returnNumber: created.returnNumber,
      purchaseInvoiceNumber: created.purchaseInvoiceNumber,
      employeeId: actor.employeeId,
      totalAmount: created.totalAmount
    });

    return created;
  } finally {
    await session.endSession();
  }
}

export async function listPurchaseReturns(page: number, limit: number): Promise<{ items: PurchaseReturnDoc[]; pagination: Pagination }> {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    PurchaseReturn.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    PurchaseReturn.countDocuments()
  ]);
  return { items, pagination: buildPagination(page, limit, total) };
}

export async function getPurchaseReturnById(id: string): Promise<PurchaseReturnDoc> {
  const doc = await PurchaseReturn.findById(id);
  if (!doc) throw AppError.notFound('Purchase return');
  return doc;
}

// ---------------------------------------------------------------------------
// Combined view (replaces the old frontend's returnService.getAll() merge)
// ---------------------------------------------------------------------------

export interface CombinedReturnRow {
  id: string;
  type: 'Sales Return' | 'Purchase Return';
  returnNumber: string;
  referenceInvoiceNumber: string;
  partyName: string;
  date: Date;
  amount: number;
}

export async function listCombinedReturns(page: number, limit: number): Promise<{ items: CombinedReturnRow[]; pagination: Pagination }> {
  const skip = (page - 1) * limit;

  const [result] = await SalesReturn.aggregate([
    {
      $project: {
        type: { $literal: 'Sales Return' },
        returnNumber: 1,
        referenceInvoiceNumber: '$originalInvoiceNumber',
        partyName: '$customerName',
        date: 1,
        amount: '$totalRefundAmount'
      }
    },
    {
      $unionWith: {
        coll: 'purchasereturns',
        pipeline: [
          {
            $project: {
              type: { $literal: 'Purchase Return' },
              returnNumber: 1,
              referenceInvoiceNumber: '$purchaseInvoiceNumber',
              partyName: '$supplierName',
              date: 1,
              amount: '$totalAmount'
            }
          }
        ]
      }
    },
    { $sort: { date: -1 } },
    {
      $facet: {
        data: [{ $skip: skip }, { $limit: limit }],
        totalCount: [{ $count: 'count' }]
      }
    }
  ]);

  const items: CombinedReturnRow[] = (result?.data ?? []).map(
    (d: { _id: unknown; type: 'Sales Return' | 'Purchase Return'; returnNumber: string; referenceInvoiceNumber: string; partyName: string; date: Date; amount: number }) => ({
      id: (d._id as { toString(): string }).toString(),
      type: d.type,
      returnNumber: d.returnNumber,
      referenceInvoiceNumber: d.referenceInvoiceNumber,
      partyName: d.partyName,
      date: d.date,
      amount: d.amount
    })
  );
  const total = result?.totalCount?.[0]?.count ?? 0;

  return { items, pagination: buildPagination(page, limit, total) };
}
