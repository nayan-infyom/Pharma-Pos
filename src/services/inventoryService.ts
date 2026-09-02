import { StockMovement, StockAdjustment, ExpiryRadarItem, Medicine } from '../types';
import * as inventoryApi from '../api/inventory';
import { Pagination } from '../api/client';

/**
 * Phase K batch 3: backed by the real API. Stock is server-authoritative —
 * this adapter no longer computes previousStock/newStock/quantityChange
 * locally, and no longer accepts medicineName/batchNumber/adjustedBy from
 * the caller (the server derives all three from the medicine/batch/actor).
 */
class InventoryService {
  /** Capped convenience for DashboardPage's "recent movements" widget — see medicineService's identical, already-flagged limitation. */
  async getMovements(limit = 25): Promise<StockMovement[]> {
    const { items } = await inventoryApi.listMovements({ limit });
    return items;
  }

  async listMovements(params: inventoryApi.ListMovementsParams = {}): Promise<{ items: StockMovement[]; pagination: Pagination }> {
    return inventoryApi.listMovements(params);
  }

  async listAdjustments(page = 1, limit = 25): Promise<{ items: StockAdjustment[]; pagination: Pagination }> {
    return inventoryApi.listAdjustments(page, limit);
  }

  /**
   * Server derives medicineName/batchNumber from the medicine/batch record
   * and adjustedBy from the authenticated actor — never trusted from the
   * client (see server/src/services/inventoryService.ts). Returns the real
   * created StockMovement.
   */
  async adjustStock(input: inventoryApi.AdjustStockRequest): Promise<StockMovement> {
    return inventoryApi.adjustStock(input);
  }

  async getExpiryRadar(
    tier: 'critical' | 'near' | 'watchlist' | 'all' = 'all',
    page = 1,
    limit = 50
  ): Promise<{ items: ExpiryRadarItem[]; pagination: Pagination }> {
    return inventoryApi.getExpiryRadar(tier, page, limit);
  }

  async getLowStock(page = 1, limit = 25): Promise<{ items: Medicine[]; pagination: Pagination }> {
    return inventoryApi.getLowStock(page, limit);
  }
}

export const inventoryService = new InventoryService();
