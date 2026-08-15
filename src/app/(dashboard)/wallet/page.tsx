'use client';

import React, { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { motion } from 'framer-motion';
import { 
  Wallet, ArrowDownLeft, ArrowUpRight, TrendingUp, TrendingDown,
  Info, Clock, PlusCircle, MinusCircle, AlertCircle
} from 'lucide-react';

export default function WalletPage() {
  const { data, balance, loading, error, deposit, withdraw, depositing, withdrawing } = useWallet();
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setActionError('Amount must be a positive number.');
      return;
    }

    try {
      if (activeTab === 'deposit') {
        await deposit(numericAmount, description || undefined);
        setActionSuccess(`Successfully deposited ₹${numericAmount.toLocaleString('en-IN')}!`);
      } else {
        await withdraw(numericAmount, description || undefined);
        setActionSuccess(`Successfully withdrew ₹${numericAmount.toLocaleString('en-IN')}!`);
      }
      setAmount('');
      setDescription('');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Transaction failed.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse bg-gray-200 h-8 w-48 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="animate-pulse bg-gray-200 h-32 rounded-2xl" />
          <div className="animate-pulse bg-gray-200 h-32 rounded-2xl" />
          <div className="animate-pulse bg-gray-200 h-32 rounded-2xl" />
        </div>
        <div className="animate-pulse bg-gray-200 h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] flex items-center gap-2">
          <Wallet className="w-8 h-8 text-[#2563EB]" /> Shared Wallet
        </h1>
        <p className="text-gray-500 text-sm mt-1">Pool money together for common house expenses.</p>
      </div>

      {/* Top Stat Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Balance Card */}
        <div className="bg-gradient-to-br from-[#2563EB] to-[#1E40AF] rounded-3xl p-6 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-36 h-36 bg-white/10 rounded-full" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/5 rounded-full" />
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider opacity-85">Wallet Balance</p>
              <p className="text-3xl font-bold mt-2">₹{balance.toLocaleString('en-IN')}</p>
            </div>
            <p className="text-[10px] opacity-75 mt-4">Transparent pool for groceries and bills</p>
          </div>
        </div>

        {/* Total In Card */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Deposits</p>
            <p className="text-xl font-bold text-slate-800 mt-1">₹{(data?.totalIn ?? 0).toLocaleString('en-IN')}</p>
          </div>
        </div>

        {/* Total Out Card */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Withdrawals</p>
            <p className="text-xl font-bold text-slate-800 mt-1">₹{(data?.totalOut ?? 0).toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Transaction logs */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-3xl shadow-sm p-6 space-y-4">
          <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-400" /> Transaction History
          </h3>

          {!data?.transactions || data.transactions.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <Info className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm text-slate-400">No transactions recorded yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto pr-1">
              {data.transactions.map((txn) => (
                <div key={txn.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl shrink-0 ${
                      txn.type === 'DEPOSIT' ? 'bg-green-50 text-green-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {txn.type === 'DEPOSIT' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{txn.description || (txn.type === 'DEPOSIT' ? 'Deposit' : 'Withdrawal')}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(txn.createdAt).toLocaleDateString('en-IN')} at {new Date(txn.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <span className={`text-sm font-bold shrink-0 ${
                    txn.type === 'DEPOSIT' ? 'text-green-600' : 'text-slate-800'
                  }`}>
                    {txn.type === 'DEPOSIT' ? '+' : '-'}₹{txn.amount.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Transaction Form */}
        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-slate-800">Quick Transaction</h3>

            {/* Deposit / Withdraw Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => { setActiveTab('deposit'); setActionError(null); setActionSuccess(null); }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                  activeTab === 'deposit' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <PlusCircle className="w-4 h-4" /> Deposit
              </button>
              <button
                onClick={() => { setActiveTab('withdraw'); setActionError(null); setActionSuccess(null); }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                  activeTab === 'withdraw' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <MinusCircle className="w-4 h-4" /> Withdraw
              </button>
            </div>

            {/* Notification messages */}
            {actionError && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-100 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{actionError}</span>
              </div>
            )}
            {actionSuccess && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-green-50 text-green-700 border border-green-100 text-xs">
                <PlusCircle className="w-4 h-4 shrink-0 mt-0.5 text-green-500" />
                <span>{actionSuccess}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Amount (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="
                    w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white
                    text-sm text-slate-800 placeholder-slate-400
                    focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                    transition-all duration-200
                  "
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</label>
                <input
                  type="text"
                  required
                  placeholder={activeTab === 'deposit' ? 'e.g. Snack fund pool' : 'e.g. Bought cleaning products'}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="
                    w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white
                    text-sm text-slate-800 placeholder-slate-400
                    focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                    transition-all duration-200
                  "
                />
              </div>

              <button
                type="submit"
                disabled={depositing || withdrawing}
                className={`
                  w-full py-2.5 rounded-xl text-white text-xs font-bold transition-all duration-200 shadow-md ${
                    activeTab === 'deposit' 
                      ? 'bg-[#2563EB] hover:bg-[#1d4ed8] shadow-blue-500/10' 
                      : 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/10'
                  }
                `}
              >
                {activeTab === 'deposit'
                  ? (depositing ? 'Depositing...' : 'Confirm Deposit')
                  : (withdrawing ? 'Withdrawing...' : 'Confirm Withdrawal')}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
