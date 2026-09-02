import { SaleInvoice, PaymentMethod, SplitPaymentDetail } from '../types';
import * as salesApi from '../api/sales';

/**
 * Payload shape changed materially in Phase K, not just the internals: the
 * old createSale() took an ALREADY-FULLY-PRICED SaleInvoice (batch already
 * FEFO-assigned, every line's tax/discount pre-computed client-side) and
 * just persisted it + mutated stock as a side effect. The new backend
 * resolves FEFO and computes every rupee itself (Phase F) — it only accepts
 * medicineId/quantity/discountPercent per line and returns the authoritative
 * invoice. This is the one genuine frontend/backend contract mismatch this
 * phase found that an internals-only adapter couldn't paper over; the
 * PaymentModal call site was updated accordingly (see Phase K report).
 */
export interface CreateSaleInput {
  items: { medicineId: string; quantity: number; discountPercent?: number }[];
  customerId?: string;
  doctorName?: string;
  cartDiscountPercent?: number;
  paymentMethod: PaymentMethod;
  splitDetails?: SplitPaymentDetail[];
  amountPaid: number;
  notes?: string;
}

/** The frontend's PaymentMethod type keeps its legacy 'UPI/QR' label (no UI
 *  change) — this is the one enum translation needed at the API boundary,
 *  matching the canonical value the backend actually accepts (Phase C decision #3). */
function toCanonicalPaymentMethod(method: PaymentMethod): string {
  return method === 'UPI/QR' ? 'UPI' : method;
}

/**
 * customerService/CustomerModal aren't migrated yet in this Phase K checkpoint
 * — they still hand out legacy fake ids (e.g. usePOSStore's default "Walk-in
 * Customer" placeholder is 'cust-01', from src/data/customers.ts). The
 * backend only accepts a real Mongo ObjectId for customerId. Rather than
 * send an id the server will always reject with a generic validation error,
 * treat anything that isn't a 24-hex-char ObjectId as "no customer" (i.e.
 * walk-in) — this is the correct behavior for the placeholder today, and
 * will simply stop triggering once customerService is migrated to real ids.
 * Known limitation: Credit/Khata sales against a specific customer don't
 * work correctly until that migration lands (follow-on Phase K work).
 */
const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;
function toBackendCustomerId(id?: string): string | undefined {
  return id && OBJECT_ID_RE.test(id) ? id : undefined;
}

function generateIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

class SalesService {
  async getAll(): Promise<SaleInvoice[]> {
    const { items } = await salesApi.listSales({ limit: 100 });
    return items;
  }

  async getById(id: string): Promise<SaleInvoice | undefined> {
    try {
      return await salesApi.getSaleById(id);
    } catch {
      return undefined;
    }
  }

  async getByInvoiceNumber(invNum: string): Promise<SaleInvoice | undefined> {
    // No dedicated lookup-by-invoice-number endpoint — the list endpoint is
    // paginated/filterable but not by invoice number text; page 1 covers the
    // common "just billed it" case. Full search-by-invoice-number is a
    // follow-up (SalesPage isn't in this checkpoint's migrated scope yet).
    const { items } = await salesApi.listSales({ limit: 100 });
    return items.find((s) => s.invoiceNumber.toLowerCase() === invNum.toLowerCase());
  }

  async createSale(input: CreateSaleInput): Promise<SaleInvoice> {
    return salesApi.createSale({
      items: input.items,
      customerId: toBackendCustomerId(input.customerId),
      doctorName: input.doctorName,
      cartDiscountPercent: input.cartDiscountPercent,
      paymentMethod: toCanonicalPaymentMethod(input.paymentMethod),
      splitDetails: input.splitDetails?.map((s) => ({ method: toCanonicalPaymentMethod(s.method as PaymentMethod), amount: s.amount, reference: s.reference })),
      amountPaid: input.amountPaid,
      notes: input.notes,
      idempotencyKey: generateIdempotencyKey()
    });
  }
}

export const salesService = new SalesService();
