'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ExpenseSplit {
  id: string;
  userId: string;
  amount: number;
  isPaid: boolean;
  user: { id: string; name: string; avatar?: string | null };
}

export interface Expense {
  id: string;
  title: string;
  description?: string | null;
  amount: number;
  category: string;
  splitType: string;
  paidById: string;
  paidBy: { id: string; name: string; avatar?: string | null };
  roomId: string;
  splits: ExpenseSplit[];
  isPaid: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseFilters {
  search?: string;
  category?: string;
  paidById?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'amount' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface AddExpenseInput {
  title: string;
  description?: string;
  amount: number;
  category: string;
  splitType: string;
  roomId: string;
  splits?: { userId: string; amount?: number; percentage?: number }[];
}

export interface UpdateExpenseInput {
  title?: string;
  description?: string;
  amount?: number;
  category?: string;
}

export interface UseExpensesReturn {
  expenses: Expense[];
  total: number;
  page: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  filters: ExpenseFilters;
  setFilters: (filters: ExpenseFilters) => void;
  refetch: () => Promise<void>;
  addExpense: (input: AddExpenseInput) => Promise<Expense>;
  updateExpense: (id: string, input: UpdateExpenseInput) => Promise<Expense>;
  deleteExpense: (id: string) => Promise<void>;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useExpenses(initialFilters: ExpenseFilters = {}): UseExpensesReturn {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ExpenseFilters>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    ...initialFilters,
  });

  // Avoid stale closure over filters in fetchExpenses
  const filtersRef = useRef(filters);
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  /** Build query string from current filters. */
  const buildQueryString = useCallback((f: ExpenseFilters): string => {
    const params = new URLSearchParams();
    if (f.search) params.set('search', f.search);
    if (f.category) params.set('category', f.category);
    if (f.paidById) params.set('paidById', f.paidById);
    if (f.page) params.set('page', f.page.toString());
    if (f.limit) params.set('limit', f.limit.toString());
    if (f.sortBy) params.set('sortBy', f.sortBy);
    if (f.sortOrder) params.set('sortOrder', f.sortOrder);
    return params.toString();
  }, []);

  /** Fetch expenses with current filters. */
  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const qs = buildQueryString(filtersRef.current);
      const res = await fetch(`/api/expenses?${qs}`);

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed to fetch expenses (${res.status})`);
      }

      const data = await res.json();
      setExpenses(data.expenses ?? data);
      setTotal(data.pagination?.total ?? data.total ?? (Array.isArray(data) ? data.length : 0));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch expenses';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [buildQueryString]);

  // Re-fetch whenever filters change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchExpenses();
  }, [filters, fetchExpenses]);

  /** Add a new expense and refresh. */
  const addExpense = useCallback(
    async (input: AddExpenseInput): Promise<Expense> => {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to add expense');
      }

      const data = await res.json();
      const expense: Expense = data.expense ?? data;
      await fetchExpenses();
      return expense;
    },
    [fetchExpenses],
  );

  /** Update an existing expense. */
  const updateExpense = useCallback(
    async (id: string, input: UpdateExpenseInput): Promise<Expense> => {
      const res = await fetch(`/api/expenses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to update expense');
      }

      const expense: Expense = await res.json();
      await fetchExpenses();
      return expense;
    },
    [fetchExpenses],
  );

  /** Delete an expense. */
  const deleteExpense = useCallback(
    async (id: string): Promise<void> => {
      const res = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to delete expense');
      }

      await fetchExpenses();
    },
    [fetchExpenses],
  );

  const currentPage = filters.page ?? 1;
  const pageSize = filters.limit ?? 10;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    expenses,
    total,
    page: currentPage,
    totalPages,
    loading,
    error,
    filters,
    setFilters,
    refetch: fetchExpenses,
    addExpense,
    updateExpense,
    deleteExpense,
  };
}

export default useExpenses;
