import { Expense } from '../types';
import { initialExpenses } from '../data/expenses';

const STORAGE_KEY = 'pharmapos_expenses_v1';

class ExpenseService {
  private expenses: Expense[];

  constructor() {
    const saved = localStorage.getItem(STORAGE_KEY);
    this.expenses = saved ? JSON.parse(saved) : initialExpenses;
  }

  private persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.expenses));
  }

  async getAll(): Promise<Expense[]> {
    return [...this.expenses];
  }

  async create(data: Omit<Expense, 'id'>): Promise<Expense> {
    const newExpense: Expense = {
      ...data,
      id: `exp-${Date.now()}`
    };
    this.expenses.unshift(newExpense);
    this.persist();
    return newExpense;
  }

  async delete(id: string): Promise<void> {
    this.expenses = this.expenses.filter(e => e.id !== id);
    this.persist();
  }
}

export const expenseService = new ExpenseService();
