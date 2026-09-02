import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { sendPaginated, sendSuccess } from '../utils/response';
import * as expenseService from '../services/expenseService';
import { CreateExpenseBody, ListExpensesQuery } from '../validators/expense.validators';

export const list = catchAsync(async (req: Request, res: Response) => {
  const query = req.validated!.query as ListExpensesQuery;
  const { items, pagination } = await expenseService.listExpenses(query);
  sendPaginated(res, items, pagination);
});

export const create = catchAsync(async (req: Request, res: Response) => {
  const expense = await expenseService.createExpense(req.body as CreateExpenseBody, { employeeId: req.user!.employeeId });
  sendSuccess(res, expense, 201);
});

export const remove = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.validated!.params as { id: string };
  await expenseService.deleteExpense(id);
  sendSuccess(res, { deleted: true });
});
