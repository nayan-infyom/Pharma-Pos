import { z } from 'zod';
import { objectIdSchema } from './medicine.validators';

// Mirrors the shared cartItem.schema.ts shape used by both Sale.items and
// HeldSale.items. These are a display/park snapshot only — holding a cart
// never touches stock or ledgers, so nothing here needs server-side
// recomputation; the real authoritative pricing/stock check happens later,
// at actual POST /sales time, when the resumed cart is submitted for real.
const cartItemInputSchema = z.object({
  medicineId: objectIdSchema,
  medicineName: z.string().trim().min(1),
  genericName: z.string().trim().optional(),
  brand: z.string().trim().optional(),
  dosageForm: z.string().trim().optional(),
  strength: z.string().trim().optional(),
  packSize: z.string().trim().optional(),
  batchId: z.string().trim().min(1),
  batchNumber: z.string().trim().min(1),
  expiryDate: z.coerce.date(),
  availableBatchStock: z.number().min(0),
  quantity: z.number().int().min(1),
  purchasePrice: z.number().min(0),
  mrp: z.number().min(0),
  unitPrice: z.number().min(0),
  discountPercent: z.number().min(0).max(100).default(0),
  discountAmount: z.number().min(0).default(0),
  taxRate: z.number().min(0),
  taxAmount: z.number().min(0),
  subtotal: z.number().min(0),
  total: z.number().min(0),
  prescriptionRequired: z.boolean().default(false)
});

export const createHeldSaleSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1),
    customerId: objectIdSchema.optional(),
    customerSnapshot: z.object({ id: z.string(), name: z.string(), phone: z.string() }).optional(),
    items: z.array(cartItemInputSchema).min(1, 'A held cart must contain at least one item'),
    subtotal: z.number().min(0),
    discountPercent: z.number().min(0).max(100).default(0),
    taxTotal: z.number().min(0),
    grandTotal: z.number().min(0)
  })
});

export const heldSaleIdParamSchema = z.object({ params: z.object({ id: objectIdSchema }) });

export const listHeldSalesQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50)
  })
});

export type CreateHeldSaleBody = z.infer<typeof createHeldSaleSchema>['body'];
export type ListHeldSalesQuery = z.infer<typeof listHeldSalesQuerySchema>['query'];
