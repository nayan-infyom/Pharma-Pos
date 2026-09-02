import { Expense, ExpenseDoc } from '../models/Expense.model';
import { AppError } from '../errors/AppError';
import { buildPagination, Pagination } from '../utils/response';
import { CreateExpenseBody, ListExpensesQuery } from '../validators/expense.validators';

export interface ExpenseActor {
  employeeId: string;
}

export async function listExpenses(query: ListExpensesQuery): Promise<{ items: ExpenseDoc[]; pagination: Pagination }> {
  const filter: Record<string, unknown> = {};
  if (query.category) filter.category = query.category;
  if (query.from || query.to) {
    filter.date = {
      ...(query.from ? { $gte: query.from } : {}),
      ...(query.to ? { $lte: query.to } : {})
    };
  }

  const skip = (query.page - 1) * query.limit;
  const [items, total] = await Promise.all([
    Expense.find(filter).sort({ date: -1 }).skip(skip).limit(query.limit),
    Expense.countDocuments(filter)
  ]);
  return { items, pagination: buildPagination(query.page, query.limit, total) };
}

export async function createExpense(body: CreateExpenseBody, actor: ExpenseActor): Promise<ExpenseDoc> {
  return Expense.create({ ...body, recordedBy: actor.employeeId });
}

// Matches the original expenseService exactly — no update method exists there either.
export async function deleteExpense(id: string): Promise<void> {
  const result = await Expense.findByIdAndDelete(id);
  if (!result) throw AppError.notFound('Expense');
}
