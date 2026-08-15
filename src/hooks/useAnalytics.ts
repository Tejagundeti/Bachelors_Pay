'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface MonthlyTrend {
  month: string; // "2026-01", "2026-02", …
  total: number;
  count: number;
}

export interface MemberSpending {
  userId: string;
  name: string;
  avatar?: string | null;
  totalPaid: number;
  totalOwed: number;
  netBalance: number;
}

export interface AnalyticsData {
  /** Total spending in the selected period. */
  totalSpending: number;
  /** Average expense amount. */
  averageExpense: number;
  /** Number of expenses. */
  expenseCount: number;
  /** Breakdown by category. */
  categories: CategoryBreakdown[];
  /** Monthly trend data. */
  monthly: MonthlyTrend[];
  /** Per-member spending overview. */
  members: MemberSpending[];
  /** The user's own net balance (positive = owed to them). */
  myNetBalance: number;
}

export interface AnalyticsFilters {
  /** Room to scope the analytics to. */
  roomId?: string;
  /** Start of the date range (ISO string). */
  startDate?: string;
  /** End of the date range (ISO string). */
  endDate?: string;
  /** Preset period: "week" | "month" | "quarter" | "year" | "all". */
  period?: 'week' | 'month' | 'quarter' | 'year' | 'all';
}

export interface UseAnalyticsReturn {
  data: AnalyticsData | null;
  loading: boolean;
  error: string | null;
  filters: AnalyticsFilters;
  setFilters: (filters: AnalyticsFilters) => void;
  refetch: () => Promise<void>;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAnalytics(initialFilters: AnalyticsFilters = {}): UseAnalyticsReturn {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AnalyticsFilters>({
    period: 'month',
    ...initialFilters,
  });

  const filtersRef = useRef(filters);
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  /** Build query string from filters. */
  const buildQueryString = useCallback((f: AnalyticsFilters): string => {
    const params = new URLSearchParams();
    if (f.roomId) params.set('roomId', f.roomId);
    if (f.startDate) params.set('startDate', f.startDate);
    if (f.endDate) params.set('endDate', f.endDate);
    if (f.period) params.set('period', f.period);
    return params.toString();
  }, []);

  /** Fetch analytics data from the API. */
  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const qs = buildQueryString(filtersRef.current);
      const res = await fetch(`/api/analytics?${qs}`);

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed to fetch analytics (${res.status})`);
      }

      const analyticsData: AnalyticsData = await res.json();
      setData(analyticsData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch analytics';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [buildQueryString]);

  // Re-fetch when filters change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAnalytics();
  }, [filters, fetchAnalytics]);

  return {
    data,
    loading,
    error,
    filters,
    setFilters,
    refetch: fetchAnalytics,
  };
}

export default useAnalytics;
