import { z } from 'zod';

export const dateRangeQuerySchema = z.object({
  query: z.object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional()
  })
});

export const monthlyTrendQuerySchema = z.object({
  query: z.object({
    months: z.coerce.number().int().min(1).max(24).default(6)
  })
});

export const topMedicinesQuerySchema = z.object({
  query: z.object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    limit: z.coerce.number().int().min(1).max(50).default(10)
  })
});

export type DateRangeQuery = z.infer<typeof dateRangeQuerySchema>['query'];
export type MonthlyTrendQuery = z.infer<typeof monthlyTrendQuerySchema>['query'];
export type TopMedicinesQuery = z.infer<typeof topMedicinesQuerySchema>['query'];
