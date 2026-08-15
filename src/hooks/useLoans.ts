'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

export type LoanStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REPAID' | 'OVERDUE';

export interface Loan {
  id: string;
  amount: number;
  reason: string;
  status: LoanStatus;
  interestRate: number;
  dueDate: string;
  approvedAt?: string | null;
  repaidAt?: string | null;
  borrowerId: string;
  lenderId: string;
  roomId: string;
  borrower: { id: string; name: string; avatar?: string | null; creditScore: number };
  lender: { id: string; name: string; avatar?: string | null };
  createdAt: string;
  updatedAt: string;
}

export interface LoanFilters {
  status?: LoanStatus;
  role?: 'borrower' | 'lender' | 'all';
  page?: number;
  limit?: number;
}

export interface RequestLoanInput {
  amount: number;
  reason: string;
  lenderId: string;
  roomId: string;
  dueDate: string;
}

export interface UseLoansReturn {
  loans: Loan[];
  total: number;
  page: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  filters: LoanFilters;
  setFilters: (filters: LoanFilters) => void;
  refetch: () => Promise<void>;
  requestLoan: (input: RequestLoanInput) => Promise<Loan>;
  approveLoan: (loanId: string) => Promise<Loan>;
  rejectLoan: (loanId: string, reason?: string) => Promise<Loan>;
  repayLoan: (loanId: string, amount: number) => Promise<Loan>;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useLoans(initialFilters: LoanFilters = {}): UseLoansReturn {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<LoanFilters>({
    role: 'all',
    page: 1,
    limit: 10,
    ...initialFilters,
  });

  const filtersRef = useRef(filters);
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  /** Build query string from filters. */
  const buildQueryString = useCallback((f: LoanFilters): string => {
    const params = new URLSearchParams();
    if (f.status) params.set('status', f.status);
    if (f.role) params.set('role', f.role);
    if (f.page) params.set('page', f.page.toString());
    if (f.limit) params.set('limit', f.limit.toString());
    return params.toString();
  }, []);

  /** Fetch loans from the API. */
  const fetchLoans = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const qs = buildQueryString(filtersRef.current);
      const res = await fetch(`/api/loans?${qs}`);

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed to fetch loans (${res.status})`);
      }

      const data = await res.json();
      setLoans(data.loans ?? data);
      setTotal(data.total ?? (Array.isArray(data) ? data.length : 0));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch loans';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [buildQueryString]);

  // Re-fetch when filters change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLoans();
  }, [filters, fetchLoans]);

  /** Request a new loan. */
  const requestLoan = useCallback(
    async (input: RequestLoanInput): Promise<Loan> => {
      const res = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to request loan');
      }

      const loan: Loan = await res.json();
      await fetchLoans();
      return loan;
    },
    [fetchLoans],
  );

  /** Approve a pending loan (lender action). */
  const approveLoan = useCallback(
    async (loanId: string): Promise<Loan> => {
      const res = await fetch(`/api/loans/${loanId}/approve`, {
        method: 'POST',
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to approve loan');
      }

      const loan: Loan = await res.json();
      await fetchLoans();
      return loan;
    },
    [fetchLoans],
  );

  /** Reject a pending loan (lender action). */
  const rejectLoan = useCallback(
    async (loanId: string, reason?: string): Promise<Loan> => {
      const res = await fetch(`/api/loans/${loanId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to reject loan');
      }

      const loan: Loan = await res.json();
      await fetchLoans();
      return loan;
    },
    [fetchLoans],
  );

  /** Repay a loan (borrower action). */
  const repayLoan = useCallback(
    async (loanId: string, amount: number): Promise<Loan> => {
      const res = await fetch(`/api/loans/${loanId}/repay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to repay loan');
      }

      const loan: Loan = await res.json();
      await fetchLoans();
      return loan;
    },
    [fetchLoans],
  );

  const currentPage = filters.page ?? 1;
  const pageSize = filters.limit ?? 10;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    loans,
    total,
    page: currentPage,
    totalPages,
    loading,
    error,
    filters,
    setFilters,
    refetch: fetchLoans,
    requestLoan,
    approveLoan,
    rejectLoan,
    repayLoan,
  };
}

export default useLoans;
