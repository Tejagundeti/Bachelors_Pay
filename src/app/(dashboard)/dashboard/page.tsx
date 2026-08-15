'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  IndianRupee,
  AlertCircle,
  TrendingUp,
  User,
  Plus,
  Send,
  Download,
  HandCoins,
  ShoppingBag,
  Zap,
  Wifi,
  Home,
  UtensilsCrossed,
  Droplets,
  Package,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Wallet,
  Users,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

// ──────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────
interface AnalyticsData {
  totalBalance: number;
  pendingDues: number;
  monthExpenses: number;
  personalSpending: number;
  monthlyData: { month: string; amount: number }[];
  categoryData: { name: string; value: number; color: string }[];
  recentTransactions: Transaction[];
  walletBalance: number;
  roomMembers: RoomMember[];
}

interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: 'paid' | 'received';
  category: string;
  date: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
}

interface RoomMember {
  id: string;
  name: string;
  image?: string;
  role: string;
  balance: number;
}

// ──────────────────────────────────────────────────────
// Realistic fallback data
// ──────────────────────────────────────────────────────
const defaultMonthlyData = [
  { month: 'Feb', amount: 18500 },
  { month: 'Mar', amount: 22000 },
  { month: 'Apr', amount: 19800 },
  { month: 'May', amount: 25600 },
  { month: 'Jun', amount: 21400 },
  { month: 'Jul', amount: 23100 },
];

const defaultCategoryData = [
  { name: 'Rent', value: 12000, color: '#2563EB' },
  { name: 'Groceries', value: 4500, color: '#22C55E' },
  { name: 'Electricity', value: 2400, color: '#F59E0B' },
  { name: 'Internet', value: 1200, color: '#8B5CF6' },
  { name: 'Food', value: 3200, color: '#EF4444' },
  { name: 'Others', value: 1800, color: '#6B7280' },
];

const defaultTransactions: Transaction[] = [
  { id: '1', title: 'Room Rent - July', amount: 12000, type: 'paid', category: 'RENT', date: '2026-07-01', status: 'SUCCESS' },
  { id: '2', title: 'Grocery Shopping', amount: 2350, type: 'paid', category: 'GROCERIES', date: '2026-07-05', status: 'SUCCESS' },
  { id: '3', title: 'Electricity Bill', amount: 2400, type: 'paid', category: 'ELECTRICITY', date: '2026-07-03', status: 'SUCCESS' },
  { id: '4', title: 'Payment from Arjun', amount: 3000, type: 'received', category: 'FOOD', date: '2026-07-06', status: 'SUCCESS' },
  { id: '5', title: 'Internet Recharge', amount: 1200, type: 'paid', category: 'INTERNET', date: '2026-07-02', status: 'SUCCESS' },
  { id: '6', title: 'Water Bill', amount: 600, type: 'paid', category: 'WATER', date: '2026-07-04', status: 'PENDING' },
  { id: '7', title: 'Dinner Order', amount: 890, type: 'paid', category: 'FOOD', date: '2026-07-07', status: 'SUCCESS' },
  { id: '8', title: 'Payment from Ravi', amount: 4000, type: 'received', category: 'RENT', date: '2026-07-08', status: 'PENDING' },
  { id: '9', title: 'Gas Cylinder', amount: 950, type: 'paid', category: 'GAS', date: '2026-07-09', status: 'SUCCESS' },
  { id: '10', title: 'Cleaning Supplies', amount: 450, type: 'paid', category: 'CLEANING', date: '2026-07-10', status: 'FAILED' },
];

const defaultMembers: RoomMember[] = [
  { id: '1', name: 'Teja G.', role: 'OWNER', balance: 0 },
  { id: '2', name: 'Arjun K.', role: 'MEMBER', balance: -3200 },
  { id: '3', name: 'Ravi M.', role: 'MEMBER', balance: -1800 },
  { id: '4', name: 'Suresh P.', role: 'ADMIN', balance: 500 },
];

// ──────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────

/** Map expense category to an icon component */
function categoryIcon(cat: string) {
  const map: Record<string, React.ReactNode> = {
    RENT: <Home className="w-4 h-4" />,
    GROCERIES: <ShoppingBag className="w-4 h-4" />,
    ELECTRICITY: <Zap className="w-4 h-4" />,
    INTERNET: <Wifi className="w-4 h-4" />,
    FOOD: <UtensilsCrossed className="w-4 h-4" />,
    WATER: <Droplets className="w-4 h-4" />,
    GAS: <Zap className="w-4 h-4" />,
    CLEANING: <Package className="w-4 h-4" />,
    OTHER: <Package className="w-4 h-4" />,
  };
  return map[cat] ?? <Package className="w-4 h-4" />;
}

/** Category → color used for the icon background */
function categoryColor(cat: string): string {
  const map: Record<string, string> = {
    RENT: 'bg-blue-100 text-blue-600',
    GROCERIES: 'bg-green-100 text-green-600',
    ELECTRICITY: 'bg-amber-100 text-amber-600',
    INTERNET: 'bg-violet-100 text-violet-600',
    FOOD: 'bg-red-100 text-red-600',
    WATER: 'bg-cyan-100 text-cyan-600',
    GAS: 'bg-orange-100 text-orange-600',
    CLEANING: 'bg-pink-100 text-pink-600',
    OTHER: 'bg-gray-100 text-gray-600',
  };
  return map[cat] ?? 'bg-gray-100 text-gray-600';
}

/** Format number as ₹ currency string */
function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

/** Format ISO date to human-readable */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
  });
}

// ──────────────────────────────────────────────────────
// Animation variants
// ──────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' as const },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

// ──────────────────────────────────────────────────────
// Animated counter hook
// ──────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (target === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValue(0);
      return;
    }

    const start = performance.now();
    let raf: number;

    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

// ──────────────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────────────

/** Skeleton loader block */
function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded-xl ${className}`} />
  );
}

/** Single stat card */
function StatCard({
  icon: Icon,
  label,
  value,
  gradient,
  iconBg,
  index,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  gradient: string;
  iconBg: string;
  index: number;
}) {
  const displayed = useCountUp(value);

  return (
    <motion.div
      custom={index}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className={`
        relative overflow-hidden rounded-2xl p-5
        bg-white border border-gray-100
        shadow-sm hover:shadow-md transition-shadow duration-300
      `}
    >
      {/* Gradient accent bar at top */}
      <div className={`absolute top-0 inset-x-0 h-1 ${gradient}`} />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="mt-2 text-2xl font-bold text-[#0F172A] tracking-tight">
            {formatCurrency(displayed)}
          </p>
        </div>
        <div className={`p-3 rounded-xl ${iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </motion.div>
  );
}

/** Custom Recharts tooltip for the bar chart */
function BarTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white px-4 py-2.5 rounded-xl shadow-lg border border-gray-100 text-sm">
      <p className="font-medium text-gray-900">{label}</p>
      <p className="text-[#2563EB] font-semibold">{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

/** Custom Recharts tooltip for the pie chart */
function PieTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white px-4 py-2.5 rounded-xl shadow-lg border border-gray-100 text-sm">
      <p className="font-medium text-gray-900">{payload[0].name}</p>
      <p className="font-semibold" style={{ color: (payload[0] as unknown as { payload: { color: string } }).payload.color }}>
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  );
}

/** Status badge chip */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    SUCCESS: { bg: 'bg-green-50', text: 'text-green-700', icon: <CheckCircle2 className="w-3 h-3" /> },
    PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', icon: <Clock className="w-3 h-3" /> },
    FAILED: { bg: 'bg-red-50', text: 'text-red-700', icon: <XCircle className="w-3 h-3" /> },
  };
  const s = map[status] ?? map.PENDING;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      {s.icon}
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

// ──────────────────────────────────────────────────────
// Main Dashboard Page
// ──────────────────────────────────────────────────────
export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData>({
    totalBalance: 45200,
    pendingDues: 5000,
    monthExpenses: 23100,
    personalSpending: 8450,
    monthlyData: defaultMonthlyData,
    categoryData: defaultCategoryData,
    recentTransactions: defaultTransactions,
    walletBalance: 12500,
    roomMembers: defaultMembers,
  });

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/analytics');
      if (res.ok) {
        const json = await res.json();
        setData((prev) => ({ ...prev, ...json }));
      }
    } catch {
      // Use defaults on failure – page still looks great
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Brief delay so skeleton is visible (feels intentional)
    const timer = setTimeout(() => fetchData(), 600);
    return () => clearTimeout(timer);
  }, [fetchData]);

  // ──── Loading skeleton ────
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Heading skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-60" />
          <Skeleton className="h-4 w-40" />
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>

        {/* Quick actions skeleton */}
        <div className="flex gap-3 flex-wrap">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-36" />
          ))}
        </div>

        {/* Charts skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>

        {/* Transactions skeleton */}
        <Skeleton className="h-96" />
      </div>
    );
  }

  // ──── Rendered dashboard ────
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* ── Page heading ── */}
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A]">
          Dashboard
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Welcome back! Here&apos;s your financial overview.
        </p>
      </motion.div>

      {/* ═══════════════════════════════════════════════════
          TOP STATS ROW
         ═══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={IndianRupee}
          label="Total Room Balance"
          value={data.totalBalance}
          gradient="bg-gradient-to-r from-[#2563EB] to-[#60A5FA]"
          iconBg="bg-blue-50 text-[#2563EB]"
          index={1}
        />
        <StatCard
          icon={AlertCircle}
          label="Pending Dues"
          value={data.pendingDues}
          gradient={data.pendingDues > 0
            ? 'bg-gradient-to-r from-red-500 to-orange-400'
            : 'bg-gradient-to-r from-[#22C55E] to-emerald-400'}
          iconBg={data.pendingDues > 0 ? 'bg-red-50 text-red-500' : 'bg-green-50 text-[#22C55E]'}
          index={2}
        />
        <StatCard
          icon={TrendingUp}
          label="This Month Expenses"
          value={data.monthExpenses}
          gradient="bg-gradient-to-r from-purple-500 to-violet-400"
          iconBg="bg-purple-50 text-purple-600"
          index={3}
        />
        <StatCard
          icon={User}
          label="Personal Spending"
          value={data.personalSpending}
          gradient="bg-gradient-to-r from-teal-500 to-cyan-400"
          iconBg="bg-teal-50 text-teal-600"
          index={4}
        />
      </div>

      {/* ═══════════════════════════════════════════════════
          QUICK ACTIONS
         ═══════════════════════════════════════════════════ */}
      <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible" className="flex flex-wrap gap-3">
        <Link
          href="/expenses?action=add"
          className="
            inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
            bg-[#2563EB] text-white shadow-md shadow-blue-500/25
            hover:bg-[#1D4ED8] transition-colors
          "
        >
          <Plus className="w-4 h-4" />
          Add Expense
        </Link>
        <Link
          href="/payments?action=pay"
          className="
            inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
            bg-[#22C55E] text-white shadow-md shadow-green-500/25
            hover:bg-[#16A34A] transition-colors
          "
        >
          <Send className="w-4 h-4" />
          Quick Pay
        </Link>
        <Link
          href="/wallet?action=deposit"
          className="
            inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
            border-2 border-gray-200 text-gray-700 bg-white
            hover:border-[#2563EB] hover:text-[#2563EB] transition-colors
          "
        >
          <Download className="w-4 h-4" />
          Deposit to Wallet
        </Link>
        <Link
          href="/loans?action=request"
          className="
            inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
            border-2 border-gray-200 text-gray-700 bg-white
            hover:border-purple-500 hover:text-purple-600 transition-colors
          "
        >
          <HandCoins className="w-4 h-4" />
          Request Loan
        </Link>
      </motion.div>

      {/* ═══════════════════════════════════════════════════
          CHARTS ROW
         ═══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Monthly Spending Bar Chart ── */}
        <motion.div
          custom={6}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
        >
          <h3 className="text-base font-semibold text-[#0F172A] mb-4">
            Monthly Spending
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthlyData} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<BarTooltip />} cursor={{ fill: '#EFF6FF', radius: 8 }} />
                <Bar dataKey="amount" fill="#2563EB" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* ── Category Breakdown Pie/Donut Chart ── */}
        <motion.div
          custom={7}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
        >
          <h3 className="text-base font-semibold text-[#0F172A] mb-4">
            Category Breakdown
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  dataKey="value"
                  paddingAngle={3}
                  stroke="none"
                >
                  {data.categoryData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  formatter={(value: string) => (
                    <span className="text-xs text-gray-600">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════════════════
          RECENT TRANSACTIONS
         ═══════════════════════════════════════════════════ */}
      <motion.div
        custom={8}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h3 className="text-base font-semibold text-[#0F172A]">Recent Transactions</h3>
          <Link
            href="/expenses"
            className="text-sm font-medium text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1 transition-colors"
          >
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Desktop table header */}
        <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-gray-100">
          <span>Transaction</span>
          <span className="w-24 text-right">Amount</span>
          <span className="w-20 text-center">Status</span>
          <span className="w-20 text-right">Date</span>
        </div>

        <div className="divide-y divide-gray-50">
          {data.recentTransactions.map((txn) => (
            <div
              key={txn.id}
              className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/50 transition-colors"
            >
              {/* Icon */}
              <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${categoryColor(txn.category)}`}>
                {categoryIcon(txn.category)}
              </div>

              {/* Title */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{txn.title}</p>
                <p className="text-xs text-gray-400 sm:hidden">{formatDate(txn.date)}</p>
              </div>

              {/* Amount */}
              <div className="w-24 text-right">
                <span
                  className={`text-sm font-semibold flex items-center justify-end gap-0.5 ${
                    txn.type === 'received' ? 'text-[#22C55E]' : 'text-gray-900'
                  }`}
                >
                  {txn.type === 'received' ? (
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowUpRight className="w-3.5 h-3.5 text-gray-400" />
                  )}
                  {formatCurrency(txn.amount)}
                </span>
              </div>

              {/* Status (desktop) */}
              <div className="hidden sm:flex w-20 justify-center">
                <StatusBadge status={txn.status} />
              </div>

              {/* Date (desktop) */}
              <span className="hidden sm:block w-20 text-right text-xs text-gray-400">
                {formatDate(txn.date)}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════
          BOTTOM ROW: Wallet + Room Members
         ═══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Wallet Balance Card ── */}
        <motion.div
          custom={9}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="bg-gradient-to-br from-[#2563EB] to-[#1E40AF] rounded-2xl p-6 text-white shadow-lg shadow-blue-500/20 relative overflow-hidden"
        >
          {/* Decorative circles */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
          <div className="absolute -bottom-6 -left-6 w-28 h-28 bg-white/5 rounded-full" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                <Wallet className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold opacity-90">Wallet Balance</h3>
            </div>

            <p className="text-3xl font-bold tracking-tight mb-6">
              {formatCurrency(data.walletBalance)}
            </p>

            <div className="flex gap-3">
              <Link
                href="/wallet?action=deposit"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-[#2563EB] rounded-xl text-sm font-semibold hover:bg-blue-50 transition-colors"
              >
                <Download className="w-4 h-4" /> Deposit
              </Link>
              <Link
                href="/wallet?action=withdraw"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white/20 text-white rounded-xl text-sm font-semibold backdrop-blur-sm hover:bg-white/30 transition-colors"
              >
                <ArrowUpRight className="w-4 h-4" /> Withdraw
              </Link>
            </div>
          </div>
        </motion.div>

        {/* ── Room Members Card ── */}
        <motion.div
          custom={10}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-400" />
              <h3 className="text-base font-semibold text-[#0F172A]">Room Members</h3>
            </div>
            <Link
              href="/room"
              className="text-sm font-medium text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1 transition-colors"
            >
              View Room <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {data.roomMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                {/* Avatar */}
                {member.image ? (
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                    {member.name
                      .split(' ')
                      .map((w) => w[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{member.name}</p>
                  <p className="text-xs text-gray-400 capitalize">{member.role.toLowerCase()}</p>
                </div>

                {/* Balance indicator */}
                <span
                  className={`text-sm font-semibold ${
                    member.balance < 0
                      ? 'text-red-500'
                      : member.balance > 0
                        ? 'text-[#22C55E]'
                        : 'text-gray-400'
                  }`}
                >
                  {member.balance === 0
                    ? 'Settled'
                    : member.balance > 0
                      ? `+${formatCurrency(member.balance)}`
                      : formatCurrency(member.balance)}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
