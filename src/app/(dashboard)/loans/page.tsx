'use client';

import React, { useState } from 'react';
import { useLoans } from '@/hooks/useLoans';
import { useRoom } from '@/hooks/useRoom';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HandCoins, AlertCircle, CheckCircle2, User, Clock, Calendar, 
  HelpCircle, ChevronRight, Check, X, Shield, ArrowUpRight, ArrowDownLeft
} from 'lucide-react';
import { getScoreTier, getScoreColor, maxLoanAmount, isEligibleForLoan } from '@/lib/services/credit-score';

export default function LoansPage() {
  const { data: session } = useSession();
  const { room } = useRoom();
  const { 
    loans, total, loading, error, requestLoan, approveLoan, rejectLoan, repayLoan 
  } = useLoans();

  const [activeTab, setActiveTab] = useState<'borrows' | 'lends'>('borrows');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [lenderId, setLenderId] = useState('');
  const [dueDate, setDueDate] = useState('');
  
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Get current user's credit score from room members data
  const currentUserMembership = room?.members.find((m) => m.userId === session?.user?.id);
  const creditScore = currentUserMembership?.user.creditScore ?? 700;
  const scoreTier = getScoreTier(creditScore);
  const scoreColor = getScoreColor(scoreTier);
  const eligibleLimit = maxLoanAmount(creditScore);
  const canBorrow = isEligibleForLoan(creditScore);

  // Filter roommates for select input (exclude current user)
  const roommates = room?.members.filter((m) => m.userId !== session?.user?.id) || [];

  // Filter loans for display
  const myBorrows = loans.filter((l) => l.borrowerId === session?.user?.id);
  const myLends = loans.filter((l) => l.lenderId === session?.user?.id);
  const activeList = activeTab === 'borrows' ? myBorrows : myLends;

  const handleRequestLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    const numAmt = parseFloat(amount);
    if (isNaN(numAmt) || numAmt <= 0) {
      setActionError('Amount must be a positive number.');
      return;
    }
    if (numAmt > eligibleLimit) {
      setActionError(`Requested amount exceeds your limit of ₹${eligibleLimit.toLocaleString('en-IN')}`);
      return;
    }
    if (!lenderId) {
      setActionError('Please select a roommate lender.');
      return;
    }
    if (!dueDate) {
      setActionError('Please choose a repayment due date.');
      return;
    }

    setSubmitting(true);

    try {
      if (!room) throw new Error('No active room found.');

      await requestLoan({
        amount: numAmt,
        reason,
        lenderId,
        roomId: room.id,
        dueDate: new Date(dueDate).toISOString(),
      });

      setActionSuccess('Loan request submitted successfully!');
      setAmount('');
      setReason('');
      setLenderId('');
      setDueDate('');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to request loan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: string) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      await approveLoan(id);
      setActionSuccess('Loan approved successfully! Funds logged as transferred.');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Approval failed.');
    }
  };

  const handleReject = async (id: string) => {
    const reasonText = prompt('Enter reason for rejection:');
    if (reasonText === null) return;
    setActionError(null);
    setActionSuccess(null);
    try {
      await rejectLoan(id, reasonText || undefined);
      setActionSuccess('Loan request rejected.');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Rejection failed.');
    }
  };

  const handleRepay = async (id: string, fullAmount: number) => {
    if (!confirm(`Confirm repayment of ₹${fullAmount.toLocaleString('en-IN')}? This settles the loan.`)) return;
    setActionError(null);
    setActionSuccess(null);
    try {
      await repayLoan(id, fullAmount);
      setActionSuccess('Repayment recorded! Credit score boosted.');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Repayment failed.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse bg-gray-200 h-8 w-48 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="animate-pulse bg-gray-200 h-96 rounded-3xl" />
          <div className="lg:col-span-2 animate-pulse bg-gray-200 h-[500px] rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] flex items-center gap-2">
          <HandCoins className="w-8 h-8 text-[#2563EB]" /> Micro Loans
        </h1>
        <p className="text-gray-500 text-sm mt-1">Request quick loans from roommates with automated credit rating updates.</p>
      </div>

      {actionError && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-100 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-green-50 text-green-700 border border-green-100 text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-green-500" />
          <span>{actionSuccess}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Credit eligibility + Request Form */}
        <div className="space-y-6">
          {/* Eligibility Card */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
              <Shield className="w-4.5 h-4.5 text-blue-500" /> Credit Limit & Standing
            </h3>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Internal Score</p>
                <p className="text-2xl font-bold mt-1" style={{ color: scoreColor }}>
                  {creditScore}{' '}
                  <span className="text-xs font-semibold text-slate-400">({scoreTier})</span>
                </p>
              </div>

              {/* Status Ring mock */}
              <div className="relative w-12 h-12 rounded-full border-4 flex items-center justify-center font-bold text-xs" style={{ borderColor: scoreColor, color: scoreColor }}>
                {Math.round((creditScore / 900) * 100)}%
              </div>
            </div>

            <div className="border-t border-slate-50 pt-3">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Eligible Loan Limit</p>
              <p className="text-xl font-bold text-slate-800 mt-1">
                {canBorrow ? `₹${eligibleLimit.toLocaleString('en-IN')}` : '₹0 (Ineligible)'}
              </p>
              {!canBorrow && (
                <p className="text-[10px] text-red-500 mt-1">
                  Credit score must be at least 600 to request loans.
                </p>
              )}
            </div>
          </div>

          {/* Request Form */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-semibold text-slate-800">Request a Loan</h3>
            <form onSubmit={handleRequestLoan} className="space-y-4">
              {/* Amount */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount (₹)</label>
                <input
                  type="number"
                  required
                  disabled={!canBorrow}
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-50"
                />
              </div>

              {/* Lender */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Borrow From</label>
                <select
                  value={lenderId}
                  onChange={(e) => setLenderId(e.target.value)}
                  required
                  disabled={!canBorrow}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white disabled:opacity-50"
                >
                  <option value="">Select Roommate</option>
                  {roommates.map((m) => (
                    <option key={m.id} value={m.userId}>
                      {m.user.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Due date */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Repayment Date</label>
                <input
                  type="date"
                  required
                  disabled={!canBorrow}
                  value={dueDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-50"
                />
              </div>

              {/* Reason */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Reason</label>
                <input
                  type="text"
                  required
                  disabled={!canBorrow}
                  placeholder="Medical, food budget, flat supplies..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={!canBorrow || submitting}
                className="w-full py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-bold transition-all disabled:opacity-50"
              >
                {submitting ? 'Requesting...' : 'Request Loan'}
              </button>
            </form>
          </div>
        </div>

        {/* Right 2 Columns: Loans logs */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-3xl shadow-sm p-6 space-y-6">
          {/* Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl max-w-xs">
            <button
              onClick={() => setActiveTab('borrows')}
              className={`flex-grow py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'borrows' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" /> My Borrows ({myBorrows.length})
            </button>
            <button
              onClick={() => setActiveTab('lends')}
              className={`flex-grow py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'lends' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" /> My Lends ({myLends.length})
            </button>
          </div>

          {/* List */}
          {activeList.length === 0 ? (
            <div className="text-center py-20 space-y-2">
              <Clock className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm text-slate-400">No active loans found under this tab.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 pr-1">
              {activeList.map((loan) => {
                const statusColors: Record<string, string> = {
                  PENDING: 'bg-amber-50 text-amber-700 border-amber-100',
                  APPROVED: 'bg-blue-50 text-blue-700 border-blue-100',
                  REJECTED: 'bg-red-50 text-red-700 border-red-100',
                  REPAID: 'bg-green-50 text-green-700 border-green-100',
                  OVERDUE: 'bg-rose-50 text-rose-700 border-rose-100',
                };

                return (
                  <div key={loan.id} className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-2 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-800">₹{loan.amount.toLocaleString('en-IN')}</span>
                        <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full ${statusColors[loan.status] || 'bg-gray-50 text-gray-700 border-gray-150'}`}>
                          {loan.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 font-medium">
                        {activeTab === 'borrows' 
                          ? `Borrowed from ${loan.lender?.name}` 
                          : `Lent to ${loan.borrower?.name}`}
                      </p>

                      <p className="text-xs text-slate-500 font-normal">&quot;{loan.reason}&quot;</p>
                      
                      <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> Due: {new Date(loan.dueDate).toLocaleDateString('en-IN')}
                      </p>
                    </div>

                    {/* Actions based on role and status */}
                    <div className="shrink-0 flex items-center gap-2">
                      {/* Approve / Reject buttons for LENDER when status is PENDING */}
                      {activeTab === 'lends' && loan.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleApprove(loan.id)}
                            className="p-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-xl transition-all"
                            title="Approve loan"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleReject(loan.id)}
                            className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all"
                            title="Reject request"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {/* Repay button for BORROWER when status is APPROVED or OVERDUE */}
                      {activeTab === 'borrows' && (loan.status === 'APPROVED' || loan.status === 'OVERDUE') && (
                        <button
                          onClick={() => handleRepay(loan.id, loan.amount)}
                          className="px-4 py-1.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
                        >
                          Repay Loan
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
