import { z } from 'zod';
import { objectIdSchema } from './medicine.validators';
import { PURCHASE_RETURN_REASONS, PURCHASE_RETURN_STATUSES, REFUND_METHODS, SALES_RETURN_REASONS } from '../models/enums';

// unitPrice/refundAmount (sales) and purchasePrice/totalAmount (purchase) are
// deliberately absent — server derives them from the ORIGINAL sale/purchase
// order's line snapshot, never from client input (plan: "never trust
// client-supplied derived financial values").
const salesReturnItemInputSchema = z.object({
  medicineId: objectIdSchema,
  batchNumber: z.string().trim().min(1),
  returnQuantity: z.number().int().min(1),
  reason: z.enum(SALES_RETURN_REASONS)
});

export const createSalesReturnSchema = z.object({
  body: z.object({
    originalSaleId: objectIdSchema,
    items: z.array(salesReturnItemInputSchema).min(1, 'A return must contain at least one item'),
    refundMethod: z.enum(REFUND_METHODS),
    notes: z.string().trim().optional()
  })
});

const purchaseReturnItemInputSchema = z.object({
  medicineId: objectIdSchema,
  batchNumber: z.string().trim().min(1),
  quantity: z.number().int().min(1),
  reason: z.enum(PURCHASE_RETURN_REASONS)
});

export const createPurchaseReturnSchema = z.object({
  body: z.object({
    purchaseOrderId: objectIdSchema,
    items: z.array(purchaseReturnItemInputSchema).min(1, 'A return must contain at least one item'),
    status: z.enum(PURCHASE_RETURN_STATUSES).default('Pending'),
    notes: z.string().trim().optional()
  })
});

export const returnIdParamSchema = z.object({ params: z.object({ id: objectIdSchema }) });

export const listReturnsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(25)
  })
});

export type CreateSalesReturnBody = z.infer<typeof createSalesReturnSchema>['body'];
export type CreatePurchaseReturnBody = z.infer<typeof createPurchaseReturnSchema>['body'];
export type ListReturnsQuery = z.infer<typeof listReturnsQuerySchema>['query'];
