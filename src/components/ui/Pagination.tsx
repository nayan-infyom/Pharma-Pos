import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';
import type { Pagination as PaginationMeta } from '../../api/client';

interface PaginationProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  itemLabel?: string;
}

/** Shared pager bar for API-backed list pages (Phase K batch 2 — Customers/Suppliers). */
export const Pagination: React.FC<PaginationProps> = ({ pagination, onPageChange, itemLabel = 'items' }) => {
  const { page, totalPages, total } = pagination;
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-3.5 py-2.5 border-t border-slate-200 bg-slate-50/60">
      <span className="text-[11px] text-slate-500">
        Page <span className="font-semibold text-slate-700">{page}</span> of{' '}
        <span className="font-semibold text-slate-700">{totalPages}</span> • {total} {itemLabel}
      </span>
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="xs"
          leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Prev
        </Button>
        <Button
          variant="outline"
          size="xs"
          rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
};
