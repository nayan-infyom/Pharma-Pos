import { HeldSale, HeldSaleDoc } from '../models/HeldSale.model';
import { AppError } from '../errors/AppError';
import { buildPagination, Pagination } from '../utils/response';
import { CreateHeldSaleBody, ListHeldSalesQuery } from '../validators/heldSale.validators';

export interface HeldSaleActor {
  employeeId: string;
}

/**
 * Every read/write here is scoped to cashierId === actor.employeeId — one
 * cashier's parked carts are never visible or resumable by another (plan
 * §13: held sales are real in-progress business state, not a shared pool).
 * A held sale belonging to someone else 404s rather than 403s, so its
 * existence isn't leaked to a cashier who isn't its owner.
 */
export async function holdSale(body: CreateHeldSaleBody, actor: HeldSaleActor): Promise<HeldSaleDoc> {
  return HeldSale.create({ ...body, cashierId: actor.employeeId });
}

export async function listHeldSales(actor: HeldSaleActor, query: ListHeldSalesQuery): Promise<{ items: HeldSaleDoc[]; pagination: Pagination }> {
  const filter = { cashierId: actor.employeeId };
  const skip = (query.page - 1) * query.limit;
  const [items, total] = await Promise.all([
    HeldSale.find(filter).sort({ heldAt: -1 }).skip(skip).limit(query.limit),
    HeldSale.countDocuments(filter)
  ]);
  return { items, pagination: buildPagination(query.page, query.limit, total) };
}

export async function getHeldSaleById(id: string, actor: HeldSaleActor): Promise<HeldSaleDoc> {
  const heldSale = await HeldSale.findOne({ _id: id, cashierId: actor.employeeId });
  if (!heldSale) throw AppError.notFound('Held sale');
  return heldSale;
}

export async function deleteHeldSale(id: string, actor: HeldSaleActor): Promise<void> {
  const result = await HeldSale.deleteOne({ _id: id, cashierId: actor.employeeId });
  if (result.deletedCount === 0) throw AppError.notFound('Held sale');
}
