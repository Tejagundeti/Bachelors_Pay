'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRoom } from '@/hooks/useRoom';
import { useExpenses } from '@/hooks/useExpenses';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, Send, CheckCircle2, User, HelpCircle, 
  Clock, Calendar, AlertCircle, Info, Copy, Check, ChevronLeft, ChevronRight
} from 'lucide-react';

interface PaymentHistory {
  id: string;
  amount: number;
  method: string;
  status: string;
  notes?: string | null;
  transactionId?: string | null;
  createdAt: string;
  sender: { id: string; name: string };
  receiver: { id: string; name: string };
  expense?: { id: string; title: string } | null;
}

export default function PaymentsPage() {
  const { room } = useRoom();
  const { expenses } = useExpenses({ limit: 50 }); // Fetch recent expenses for linking
  const [history, setHistory] = useState<PaymentHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);

  // Form states
  const [receiverId, setReceiverId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('UPI');
  const [expenseId, setExpenseId] = useState('');
  const [notes, setNotes] = useState('');
  const [transactionId, setTransactionId] = useState('');
  
  const [copiedLink, setCopiedLink] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Fetch payment history
  const fetchPaymentHistory = useCallback(async () => {
    try {
      setLoadingHistory(true);
      const res = await fetch(`/api/payments?page=${historyPage}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data.payments || []);
        setHistoryTotal(data.pagination?.total || 0);
        setHistoryTotalPages(data.pagination?.totalPages || 1);
      }
    } catch {
      // Ignore silently
    } finally {
      setLoadingHistory(false);
    }
  }, [historyPage]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPaymentHistory();
  }, [fetchPaymentHistory]);

  // Find room members the current user can pay
  const potentialPayees = useMemo(() => room?.members || [], [room?.members]);

  // Find outstanding expenses paid by the selected payee where current user has unpaid split
  const outstandingSplitsForPayee = expenses.filter((exp) => {
    if (exp.paidById !== receiverId || exp.isPaid) return false;
    // Check if current user is in splits and hasn't paid
    return exp.splits.some((s) => s.userId !== receiverId && !s.isPaid);
  });

  // Automatically update amount when expense is selected
  const handleExpenseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setExpenseId(selectedId);
    if (selectedId) {
      const selectedExpense = expenses.find((exp) => exp.id === selectedId);
      if (selectedExpense) {
        // Find split amount for this user
        // If not found, use a fallback
        setAmount((selectedExpense.amount / 4).toString()); // fallback division
      }
    } else {
      setAmount('');
    }
  };

  // Generate UPI QR details when UPI method, receiver, and amount are entered
  const upiLink = useMemo(() => {
    if (method === 'UPI' && receiverId && amount) {
      const numAmt = parseFloat(amount);
      if (!isNaN(numAmt) && numAmt > 0) {
        const selectedPayee = potentialPayees.find((m) => m.userId === receiverId);
        const payeeName = selectedPayee?.user.name || 'Roommate';
        const mockUpiId = `${payeeName.toLowerCase().replace(/\s+/g, '')}@okaxis`;
        
        const params = new URLSearchParams({
          pa: mockUpiId,
          pn: payeeName,
          am: numAmt.toFixed(2),
          cu: 'INR',
          tn: notes || 'BachelorsPay Settlement',
        });
        return `upi://pay?${params.toString()}`;
      }
    }
    return null;
  }, [method, receiverId, amount, notes, potentialPayees]);

  const handleCopyLink = () => {
    if (upiLink) {
      navigator.clipboard.writeText(upiLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const numAmt = parseFloat(amount);
    if (!receiverId) {
      setFormError('Please select a roommate.');
      return;
    }
    if (isNaN(numAmt) || numAmt <= 0) {
      setFormError('Please enter a valid positive amount.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: numAmt,
          receiverId,
          method,
          expenseId: expenseId || undefined,
          transactionId: transactionId || undefined,
          notes: notes || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to record payment');
      }

      setFormSuccess('Payment recorded successfully!');
      // Reset form
      setReceiverId('');
      setAmount('');
      setExpenseId('');
      setNotes('');
      setTransactionId('');
      fetchPaymentHistory();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] flex items-center gap-2">
          <CreditCard className="w-8 h-8 text-[#2563EB]" /> Payments & Settlements
        </h1>
        <p className="text-gray-500 text-sm mt-1">Settle outstanding balances with roommates directly.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Settlement Form & UPI Engine */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
            <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2 mb-4">
              <Send className="w-5 h-5 text-blue-500" /> Settle Balances
            </h3>

            {formError && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-100 text-sm mb-4">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-green-50 text-green-700 border border-green-100 text-sm mb-4">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-green-500" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Roommate Payee Selector */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pay Roommate</label>
                  <select
                    value={receiverId}
                    onChange={(e) => {
                      setReceiverId(e.target.value);
                      setExpenseId('');
                      setAmount('');
                    }}
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
                  >
                    <option value="">Select Roommate</option>
                    {potentialPayees.map((m) => (
                      <option key={m.id} value={m.userId}>
                        {m.user.name} ({m.role.toLowerCase()})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Method selector */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Payment Method</label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
                  >
                    <option value="UPI">UPI Deep Link / QR</option>
                    <option value="CASH">Cash Settlement</option>
                    <option value="WALLET">Room Wallet</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                  </select>
                </div>
              </div>

              {/* Linked Expense split */}
              {receiverId && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Link to Unpaid Expense (Optional)</label>
                  <select
                    value={expenseId}
                    onChange={handleExpenseChange}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
                  >
                    <option value="">Not linked to specific expense</option>
                    {outstandingSplitsForPayee.map((exp) => (
                      <option key={exp.id} value={exp.id}>
                        {exp.title} (₹{exp.amount.toLocaleString('en-IN')})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Amount */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                {/* External txn reference ID */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Transaction Ref ID (Optional)</label>
                  <input
                    type="text"
                    placeholder="UPI Ref / Txn ID"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Notes</label>
                <input
                  type="text"
                  placeholder="Rent settlement, grocery share, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              {/* UPI Instant Panel */}
              <AnimatePresence>
                {method === 'UPI' && upiLink && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-6"
                  >
                    {/* QR Code */}
                    <div className="bg-white border border-slate-150 p-3 rounded-2xl shrink-0 shadow-sm flex items-center justify-center">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(upiLink)}&size=160x160`} 
                        alt="UPI Settlement QR Code"
                        className="w-40 h-40 object-contain"
                      />
                    </div>

                    <div className="space-y-3 text-center sm:text-left flex-1">
                      <h4 className="text-sm font-bold text-slate-800">Scan to Settle Instantly</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Scan this QR with any UPI app (GPay, PhonePe, Paytm) to make the transfer. Alternatively, copy the deep-link to pay on mobile.
                      </p>

                      <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                        <button
                          type="button"
                          onClick={handleCopyLink}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:border-blue-500 rounded-xl text-xs font-semibold text-slate-700 hover:text-blue-600 shadow-sm transition-all"
                        >
                          {copiedLink ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedLink ? 'Copied' : 'Copy Link'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-[#2563EB] text-white hover:bg-[#1d4ed8] rounded-xl text-sm font-semibold shadow-md transition-colors"
              >
                {submitting ? 'Recording Settlement...' : 'Record Settlement Complete'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Recent Payments list */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-400" /> Payment History
            </h3>

            {loadingHistory ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-gray-200 h-14 rounded-xl" />
                ))}
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <Info className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-400">No payment records found.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 max-h-[420px] overflow-y-auto pr-1">
                {history.map((pay) => (
                  <div key={pay.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 truncate">
                        {pay.sender.name} → {pay.receiver.name}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {pay.method} • {new Date(pay.createdAt).toLocaleDateString('en-IN')}
                      </p>
                      {pay.notes && (
                        <p className="text-[10px] italic text-slate-400 mt-1 truncate">
                          &quot;{pay.notes}&quot;
                        </p>
                      )}
                    </div>
                    <span className="font-bold text-green-600 shrink-0">
                      ₹{pay.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* History Pagination */}
          {historyTotalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4 border-t border-gray-50">
              <button
                onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                disabled={historyPage === 1}
                className="p-1 border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50 transition-colors"
              >
                <ChevronLeft className="w-4.5 h-4.5" />
              </button>
              <span className="text-[11px] text-slate-400 font-semibold">
                {historyPage} / {historyTotalPages}
              </span>
              <button
                onClick={() => setHistoryPage((p) => Math.min(historyTotalPages, p + 1))}
                disabled={historyPage === historyTotalPages}
                className="p-1 border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50 transition-colors"
              >
                <ChevronRight className="w-4.5 h-4.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
