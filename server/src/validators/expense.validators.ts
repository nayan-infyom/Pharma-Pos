import { z } from 'zod';
import { objectIdSchema } from './medicine.validators';
import { EXPENSE_CATEGORIES } from '../models/enums';

// recordedBy is server-set from the authenticated actor — never client-supplied.
export const createExpenseSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1),
    category: z.enum(EXPENSE_CATEGORIES),
    amount: z.number().positive('Expense amount must be greater than 0'),
    date: z.coerce.date().default(() => new Date()),
    paymentMethod: z.enum(['Cash', 'Bank Transfer', 'UPI', 'Card']),
    paidTo: z.string().trim().optional(),
    receiptNumber: z.string().trim().optional(),
    notes: z.string().trim().optional()
  })
});

export const expenseIdParamSchema = z.object({ params: z.object({ id: objectIdSchema }) });

export const listExpensesQuerySchema = z.object({
  query: z.object({
    category: z.enum(EXPENSE_CATEGORIES).optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(25)
  })
});

export type CreateExpenseBody = z.infer<typeof createExpenseSchema>['body'];
export type ListExpensesQuery = z.infer<typeof listExpensesQuerySchema>['query'];
