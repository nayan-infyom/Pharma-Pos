import { HeldSale } from '../types';
import * as heldSalesApi from '../api/heldSales';

/** Phase K batch 5: backed by the real API — no parallel localStorage held-sale database.
 *  Scoped server-side to the authenticated cashier (see server/src/services/heldSaleService.ts). */
class HeldSalesService {
  async list(): Promise<HeldSale[]> {
    const { items } = await heldSalesApi.listHeldSales(1, 50);
    return items;
  }

  async hold(input: heldSalesApi.CreateHeldSaleRequest): Promise<HeldSale> {
    return heldSalesApi.holdSale(input);
  }

  async getById(id: string): Promise<HeldSale | undefined> {
    try {
      return await heldSalesApi.getHeldSaleById(id);
    } catch {
      return undefined;
    }
  }

  async remove(id: string): Promise<void> {
    await heldSalesApi.deleteHeldSale(id);
  }
}

export const heldSalesService = new HeldSalesService();
