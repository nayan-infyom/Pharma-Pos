import { apiDelete, apiGetPaginated, apiPost, Pagination } from './client';
import { Expense, ExpenseCategory } from '../types';

export interface ListExpensesParams {
  category?: ExpenseCategory;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface CreateExpenseRequest {
  title: string;
  category: ExpenseCategory;
  amount: number;
  date?: string;
  paymentMethod: 'Cash' | 'Bank Transfer' | 'UPI' | 'Card';
  paidTo?: string;
  receiptNumber?: string;
  notes?: string;
}

export async function listExpenses(params: ListExpensesParams = {}): Promise<{ items: Expense[]; pagination: Pagination }> {
  return apiGetPaginated<Expense>('/expenses', { ...params });
}
export async function createExpense(body: CreateExpenseRequest): Promise<Expense> {
  return apiPost<Expense>('/expenses', body);
}
export async function deleteExpense(id: string): Promise<{ deleted: boolean }> {
  return apiDelete<{ deleted: boolean }>(`/expenses/${id}`);
}
