'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface WalletTransaction {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAW' | 'EXPENSE';
  amount: number;
  description: string | null;
  createdAt: string;
  userId: string;
  user?: { id: string; name: string | null; email: string; image?: string | null };
}

export interface WalletData {
  balance: number;
  transactions: WalletTransaction[];
  totalIn: number;
  totalOut: number;
}

export interface UseWalletReturn {
  data: WalletData | null;
  balance: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  deposit: (amount: number, description?: string) => Promise<void>;
  withdraw: (amount: number, description?: string) => Promise<void>;
  depositing: boolean;
  withdrawing: boolean;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useWallet(): UseWalletReturn {
  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [depositing, setDepositing] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  /** Fetch wallet data from the API. */
  const fetchWallet = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/wallet');

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed to fetch wallet (${res.status})`);
      }

      const json = await res.json();

      // API returns { wallet: { id, balance, ... }, recentTransactions: [...] }
      const wallet = json.wallet;
      const transactions: WalletTransaction[] = json.recentTransactions ?? [];

      // Calculate totalIn / totalOut from transactions
      let totalIn = 0;
      let totalOut = 0;
      for (const txn of transactions) {
        if (txn.type === 'DEPOSIT') {
          totalIn += txn.amount;
        } else {
          totalOut += txn.amount;
        }
      }

      setData({
        balance: wallet?.balance ?? 0,
        transactions,
        totalIn,
        totalOut,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch wallet';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchWallet();
  }, [fetchWallet]);

  /** Deposit money into the wallet. */
  const deposit = useCallback(
    async (amount: number, description?: string): Promise<void> => {
      if (amount <= 0) throw new Error('Deposit amount must be positive');

      try {
        setDepositing(true);

        const res = await fetch('/api/wallet/deposit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount, description }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || 'Failed to deposit');
        }

        await fetchWallet(); // refresh balance & transactions
      } finally {
        setDepositing(false);
      }
    },
    [fetchWallet],
  );

  /** Withdraw money from the wallet. */
  const withdraw = useCallback(
    async (amount: number, description?: string): Promise<void> => {
      if (amount <= 0) throw new Error('Withdrawal amount must be positive');

      if (data && amount > data.balance) {
        throw new Error('Insufficient wallet balance');
      }

      try {
        setWithdrawing(true);

        const res = await fetch('/api/wallet/withdraw', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount, description }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || 'Failed to withdraw');
        }

        await fetchWallet();
      } finally {
        setWithdrawing(false);
      }
    },
    [fetchWallet, data],
  );

  return {
    data,
    balance: data?.balance ?? 0,
    loading,
    error,
    refetch: fetchWallet,
    deposit,
    withdraw,
    depositing,
    withdrawing,
  };
}

export default useWallet;
