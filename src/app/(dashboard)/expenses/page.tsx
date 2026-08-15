'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useExpenses } from '@/hooks/useExpenses';
import { useRoom } from '@/hooks/useRoom';
import { 
  Receipt, Plus, Search, Filter, Trash2, X, Info, 
  ChevronLeft, ChevronRight, Calendar, User, Tag, HelpCircle, AlertCircle
} from 'lucide-react';

const CATEGORIES = [
  'RENT', 'ELECTRICITY', 'WATER', 'INTERNET', 'GROCERIES',
  'GAS', 'CLEANING', 'FOOD', 'MAINTENANCE', 'OTHER'
];

export default function ExpensesPage() {
  const { room } = useRoom();
  const { 
    expenses, total, page, totalPages, loading, error, filters, setFilters, 
    addExpense, deleteExpense 
  } = useExpenses();

  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('GROCERIES');
  const [description, setDescription] = useState('');
  const [splitType, setSplitType] = useState('EQUAL');
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({}); // userId -> amount or percentage
  const [addError, setAddError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Initialize custom splits inputs when room changes or modal opens
  useEffect(() => {
    if (room?.members) {
      const initial: Record<string, string> = {};
      room.members.forEach((m) => {
        initial[m.userId] = '';
      });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCustomSplits(initial);
    }
  }, [room, isOpen]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, search: e.target.value, page: 1 });
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters({ ...filters, category: e.target.value || undefined, page: 1 });
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!room) return;
    if (!title.trim() || !amount) {
      setAddError('Title and amount are required.');
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setAddError('Amount must be a positive number.');
      return;
    }

    setAddError(null);
    setSubmitting(true);

    try {
      let splitsPayload: { userId: string; amount: number }[] | undefined = undefined;
      let percentagesPayload: { userId: string; percentage: number }[] | undefined = undefined;

      if (splitType === 'CUSTOM') {
        let totalCustom = 0;
        const splits = Object.entries(customSplits).map(([userId, val]) => {
          const amt = parseFloat(val) || 0;
          totalCustom += amt;
          return { userId, amount: amt };
        });

        if (Math.abs(totalCustom - numericAmount) > 0.05) {
          throw new Error(`Total of custom splits (₹${totalCustom.toFixed(2)}) must equal expense amount (₹${numericAmount.toFixed(2)})`);
        }
        splitsPayload = splits;
      } else if (splitType === 'PERCENTAGE') {
        let totalPct = 0;
        const percentages = Object.entries(customSplits).map(([userId, val]) => {
          const pct = parseFloat(val) || 0;
          totalPct += pct;
          return { userId, percentage: pct };
        });

        if (Math.abs(totalPct - 100) > 0.05) {
          throw new Error('Total of percentages must sum to exactly 100%');
        }
        percentagesPayload = percentages;
      }

      await addExpense({
        title,
        description: description || undefined,
        amount: numericAmount,
        category,
        splitType,
        roomId: room.id,
        // For PERCENTAGE splits, send as splits with percentage field (matches API schema)
        splits: splitsPayload || (percentagesPayload
          ? percentagesPayload.map(p => ({ userId: p.userId, percentage: p.percentage }))
          : undefined),
      });

      // Clear form & close
      setTitle('');
      setAmount('');
      setDescription('');
      setSplitType('EQUAL');
      setIsOpen(false);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to add expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense? This will revert all associated roommate debt splits.')) return;
    try {
      await deleteExpense(id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete expense');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] flex items-center gap-2">
            <Receipt className="w-8 h-8 text-[#2563EB]" /> Expenses
          </h1>
          <p className="text-gray-500 text-sm mt-1">Track and split bills in your flat.</p>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#2563EB] text-white shadow-md shadow-blue-500/25 hover:bg-[#1D4ED8] transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Expense
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center bg-white border border-gray-100 p-4 rounded-2xl shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search bills, groceries..."
            value={filters.search || ''}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-gray-400 shrink-0" />
          <select
            value={filters.category || ''}
            onChange={handleCategoryChange}
            className="w-full sm:w-44 px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0) + cat.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Expenses Table/List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 h-16 rounded-xl" />
          ))}
        </div>
      ) : expenses.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-3">
          <Info className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-semibold text-slate-800">No Expenses Found</h3>
          <p className="text-sm text-slate-400 max-w-xs mx-auto">
            Try resetting your filters or log a new flat expense to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-50">
              {expenses.map((exp) => (
                <div key={exp.id} className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50/40 transition-colors">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="bg-blue-50 text-blue-600 w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                      <Tag className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-slate-800 truncate">{exp.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-1 flex flex-wrap gap-x-2 gap-y-1">
                        <span className="flex items-center gap-1"><User className="w-3 h-3" /> Paid by {exp.paidBy?.name}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(exp.createdAt).toLocaleDateString('en-IN')}</span>
                        <span>•</span>
                        <span className="font-medium text-blue-600 bg-blue-50/50 px-1.5 py-0.5 rounded text-[10px]">
                          {exp.category}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-800">₹{exp.amount.toLocaleString('en-IN')}</p>
                      <p className="text-[10px] text-slate-400 capitalize">{exp.splitType.toLowerCase()} split</p>
                    </div>
                    <button
                      onClick={() => handleDelete(exp.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete expense"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={() => setFilters({ ...filters, page: page - 1 })}
                disabled={page === 1}
                className="p-2 border border-slate-200 rounded-xl disabled:opacity-50 hover:bg-slate-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-slate-500">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setFilters({ ...filters, page: page + 1 })}
                disabled={page === totalPages}
                className="p-2 border border-slate-200 rounded-xl disabled:opacity-50 hover:bg-slate-50 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add Expense Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="relative w-full max-w-lg bg-white border border-gray-100 shadow-2xl rounded-3xl p-6 overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 shrink-0">
                <h3 className="text-lg font-bold text-slate-800">Add New Room Expense</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Form Body */}
              <form onSubmit={handleAddExpense} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
                {addError && (
                  <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-100 text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <span>{addError}</span>
                  </div>
                )}

                {/* Title */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Expense Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Weekly Groceries"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                {/* Amount & Category row */}
                <div className="grid grid-cols-2 gap-4">
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

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat.charAt(0) + cat.slice(1).toLowerCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Description (Optional)</label>
                  <textarea
                    placeholder="Provide details about the items bought..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                  />
                </div>

                {/* Split strategy selection */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Split Strategy</label>
                  <select
                    value={splitType}
                    onChange={(e) => setSplitType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
                  >
                    <option value="EQUAL">Split Equally</option>
                    <option value="CUSTOM">Custom Amounts</option>
                    <option value="PERCENTAGE">Split by Percentage</option>
                  </select>
                </div>

                {/* Advanced split inputs */}
                {splitType !== 'EQUAL' && room?.members && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3"
                  >
                    <p className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5 text-blue-500" /> Enter values for roommates:
                    </p>

                    <div className="space-y-2">
                      {room.members.map((member) => (
                        <div key={member.id} className="flex items-center justify-between gap-3 text-sm">
                          <span className="font-medium text-slate-700 truncate">{member.user.name}</span>
                          <div className="relative max-w-[120px] shrink-0">
                            <input
                              type="number"
                              placeholder={splitType === 'PERCENTAGE' ? '%' : '₹'}
                              value={customSplits[member.userId] || ''}
                              onChange={(e) => setCustomSplits({
                                ...customSplits,
                                [member.userId]: e.target.value
                              })}
                              className="w-full pl-3 pr-8 py-1.5 rounded-lg border border-slate-200 text-right text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">
                              {splitType === 'PERCENTAGE' ? '%' : 'INR'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Action buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-100 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-sm font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2.5 bg-[#2563EB] text-white hover:bg-[#1d4ed8] rounded-xl text-sm font-semibold shadow-md transition-colors"
                  >
                    {submitting ? 'Adding...' : 'Log Expense'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
