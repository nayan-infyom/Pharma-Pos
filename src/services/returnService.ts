import { CombinedReturnRow, PurchaseReturn, SalesReturn } from '../types';
import * as returnsApi from '../api/returns';
import { Pagination } from '../api/client';

/**
 * Phase K batch 3: fully rewritten, not just an internals swap — the old
 * localStorage version hardcoded processedBy/supplierId/reason regardless of
 * what the UI submitted (audit discrepancy #2) and computed refund amounts
 * client-side. The backend now derives unitPrice/refundAmount (sales) and
 * purchasePrice/totalAmount (purchase) from the ORIGINAL sale/purchase
 * order's line snapshot, and validates cumulative returned quantity against
 * it — this adapter only forwards what the UI actually chose (medicineId,
 * batchNumber, quantity, reason) and never recomputes money.
 */
class ReturnService {
  async listCombined(page = 1, limit = 25): Promise<{ items: CombinedReturnRow[]; pagination: Pagination }> {
    return returnsApi.listCombinedReturns(page, limit);
  }

  async createSalesReturn(input: returnsApi.CreateSalesReturnRequest): Promise<SalesReturn> {
    return returnsApi.createSalesReturn(input);
  }

  async getSalesReturnById(id: string): Promise<SalesReturn | undefined> {
    try {
      return await returnsApi.getSalesReturnById(id);
    } catch {
      return undefined;
    }
  }

  async createPurchaseReturn(input: returnsApi.CreatePurchaseReturnRequest): Promise<PurchaseReturn> {
    return returnsApi.createPurchaseReturn(input);
  }

  async getPurchaseReturnById(id: string): Promise<PurchaseReturn | undefined> {
    try {
      return await returnsApi.getPurchaseReturnById(id);
    } catch {
      return undefined;
    }
  }
}

export const returnService = new ReturnService();
