'use client';

import { useState, useEffect, useCallback } from 'react';

export interface RecurringExpense {
  id: string;
  title: string;
  amount: number;
  category: string;
  dayOfMonth: number;
  isActive: boolean;
  roomId: string;
  createdAt: string;
}

export function useRecurringExpenses() {
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecurringExpenses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/expenses/recurring');

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to fetch recurring expenses');
      }

      const data = await res.json();
      setRecurringExpenses(data.recurring || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecurringExpenses();
  }, [fetchRecurringExpenses]);

  const createRecurringExpense = async (input: {
    title: string;
    amount: number;
    category: string;
    dayOfMonth: number;
  }) => {
    setError(null);
    const res = await fetch('/api/expenses/recurring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || 'Failed to create recurring expense');
    }

    await fetchRecurringExpenses();
  };

  const toggleRecurringActive = async (id: string, currentActive: boolean) => {
    setError(null);
    const res = await fetch(`/api/expenses/recurring/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !currentActive }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || 'Failed to update status');
    }

    await fetchRecurringExpenses();
  };

  const deleteRecurringExpense = async (id: string) => {
    setError(null);
    const res = await fetch(`/api/expenses/recurring/${id}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || 'Failed to delete recurring expense');
    }

    await fetchRecurringExpenses();
  };

  return {
    recurringExpenses,
    loading,
    error,
    refetch: fetchRecurringExpenses,
    createRecurringExpense,
    toggleRecurringActive,
    deleteRecurringExpense,
  };
}
