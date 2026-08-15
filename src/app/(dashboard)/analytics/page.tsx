'use client';

import React from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { BarChart3, TrendingUp, DollarSign, ListOrdered, UserCheck, Tag, Info } from 'lucide-react';

const COLORS = ['#2563EB', '#22C55E', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4', '#F97316', '#EC4899', '#14B8A6', '#6B7280'];

export default function AnalyticsPage() {
  const { data, loading } = useAnalytics();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse bg-gray-200 h-8 w-48 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="animate-pulse bg-gray-200 h-28 rounded-2xl" />
          <div className="animate-pulse bg-gray-200 h-28 rounded-2xl" />
          <div className="animate-pulse bg-gray-200 h-28 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="animate-pulse bg-gray-200 h-80 rounded-2xl" />
          <div className="animate-pulse bg-gray-200 h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  // Fallbacks in case data is empty
  const totalSpending = data?.totalSpending ?? 0;
  const averageExpense = data?.averageExpense ?? 0;
  const expenseCount = data?.expenseCount ?? 0;
  const categories = data?.categories || [];
  const monthly = data?.monthly || [];
  const members = data?.members || [];

  // Format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Convert monthly key YYYY-MM to human readable (e.g. Jul 2026)
  const formatMonth = (key: string) => {
    const parts = key.split('-');
    if (parts.length < 2) return key;
    const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
    return date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
  };

  // Recharts payload formatters
  const monthlyChartData = monthly.map((m) => ({
    month: formatMonth(m.month),
    amount: m.total,
  }));

  const categoryChartData = categories.map((c) => ({
    name: c.category.charAt(0) + c.category.slice(1).toLowerCase(),
    value: c.amount,
  }));

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] flex items-center gap-2">
          <BarChart3 className="w-8 h-8 text-[#2563EB]" /> Spending Analytics
        </h1>
        <p className="text-gray-500 text-sm mt-1">Detailed breakdown of roommate spending patterns.</p>
      </div>

      {/* Top Stat Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Money Tracked</p>
            <p className="text-xl font-bold text-slate-800 mt-1">{formatCurrency(totalSpending)}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-violet-50 text-violet-600 rounded-2xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Average Bill</p>
            <p className="text-xl font-bold text-slate-800 mt-1">{formatCurrency(averageExpense)}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <ListOrdered className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Expenses Logged</p>
            <p className="text-xl font-bold text-slate-800 mt-1">{expenseCount} Bills</p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Monthly Spending Trend</h3>
          <div className="h-64">
            {monthlyChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs gap-1.5"><Info className="w-4 h-4" /> No monthly data logged yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChartData} barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748B', fontSize: 11 }}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  />
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <Tooltip cursor={{ fill: '#EFF6FF', radius: 8 }} formatter={(v: any) => [formatCurrency(Number(v || 0)), 'Total Spending']} />
                  <Bar dataKey="amount" fill="#2563EB" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Category Distribution</h3>
          <div className="h-64">
            {categoryChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs gap-1.5"><Info className="w-4 h-4" /> No categories logged yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={85}
                    dataKey="value"
                    paddingAngle={3}
                    stroke="none"
                  >
                    {categoryChartData.map((entry, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <Tooltip formatter={(v: any) => [formatCurrency(Number(v || 0)), 'Total Spending']} />
                  <Legend verticalAlign="bottom" iconType="circle" iconSize={8} formatter={(value) => <span className="text-[11px] text-slate-500">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Member Spending Table */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-slate-400" /> Roommate Spending Details
        </h3>

        {members.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">No member statistics found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-slate-400 uppercase tracking-wider font-semibold border-b border-gray-100">
                  <th className="pb-3">Member</th>
                  <th className="pb-3 text-right">Total Paid (Credited)</th>
                  <th className="pb-3 text-right">Total Share (Owed)</th>
                  <th className="pb-3 text-right">Net Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 font-medium">
                {members.map((m) => {
                  const net = m.totalPaid - m.totalOwed;
                  return (
                    <tr key={m.userId} className="hover:bg-slate-50/30 transition-colors">
                      <td className="py-3 flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-[10px] font-bold">
                          {m.name
                            .split(' ')
                            .map((w) => w[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)}
                        </div>
                        <span className="font-semibold text-slate-800">{m.name}</span>
                      </td>
                      <td className="py-3 text-right text-slate-800">{formatCurrency(m.totalPaid)}</td>
                      <td className="py-3 text-right text-slate-500">{formatCurrency(m.totalOwed)}</td>
                      <td className={`py-3 text-right font-bold ${
                        net > 0 ? 'text-[#22C55E]' : net < 0 ? 'text-rose-500' : 'text-slate-400'
                      }`}>
                        {net > 0 ? `+${formatCurrency(net)}` : formatCurrency(net)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Category Breakdown Table */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <Tag className="w-5 h-5 text-slate-400" /> Category Breakdown details
        </h3>

        {categories.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">No category transactions found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-slate-400 uppercase tracking-wider font-semibold border-b border-gray-100">
                  <th className="pb-3">Category</th>
                  <th className="pb-3 text-right">Bills Logged</th>
                  <th className="pb-3 text-right">Total Spent</th>
                  <th className="pb-3 text-right">Percentage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 font-medium">
                {categories.map((c) => (
                  <tr key={c.category} className="hover:bg-slate-50/30 transition-colors">
                    <td className="py-3 text-slate-800 font-semibold">{c.category}</td>
                    <td className="py-3 text-right text-slate-500">{c.count} Bills</td>
                    <td className="py-3 text-right text-slate-800">{formatCurrency(c.amount)}</td>
                    <td className="py-3 text-right text-blue-600 font-semibold">{c.percentage.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
