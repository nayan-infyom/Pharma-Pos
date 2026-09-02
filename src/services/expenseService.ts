import { Expense } from '../types';
import * as expensesApi from '../api/expenses';
import { Pagination } from '../api/client';

/** Phase K batch 4: backed by the real API — no parallel localStorage expense database. */
class ExpenseService {
  /** Capped at the backend's max page size (100) — see medicineService's identical, already-flagged limitation. */
  async getAll(): Promise<Expense[]> {
    const { items } = await expensesApi.listExpenses({ limit: 100 });
    return items;
  }

  async list(params: expensesApi.ListExpensesParams = {}): Promise<{ items: Expense[]; pagination: Pagination }> {
    return expensesApi.listExpenses(params);
  }

  async create(input: expensesApi.CreateExpenseRequest): Promise<Expense> {
    return expensesApi.createExpense(input);
  }

  async delete(id: string): Promise<void> {
    await expensesApi.deleteExpense(id);
  }
}

export const expenseService = new ExpenseService();
