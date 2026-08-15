'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Wallet,
  CreditCard,
  TrendingUp,
  BarChart3,
  Banknote,
  ArrowRight,
  ChevronDown,
  Star,
  Check,
  X,
  Menu,
  Shield,
  Zap,
  Users,
  Globe,
  Share2,
  MessageSquare,
} from 'lucide-react';

/* ────────────────────────────────────────────────────────
   ANIMATION VARIANTS
   ──────────────────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

/* ────────────────────────────────────────────────────────
   SECTION WRAPPER (intersection-based animate-on-scroll)
   ──────────────────────────────────────────────────────── */
function Section({
  children,
  className = '',
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.section
      ref={ref}
      id={id}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={stagger}
      className={className}
    >
      {children}
    </motion.section>
  );
}

/* ────────────────────────────────────────────────────────
   ANIMATED COUNTER
   ──────────────────────────────────────────────────────── */
function AnimatedCounter({
  target,
  suffix = '',
  prefix = '',
}: {
  target: number;
  suffix?: string;
  prefix?: string;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 2000;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);

  return (
    <span ref={ref}>
      {prefix}
      {count.toLocaleString('en-IN')}
      {suffix}
    </span>
  );
}

/* ────────────────────────────────────────────────────────
   DATA
   ──────────────────────────────────────────────────────── */
const features = [
  {
    icon: Sparkles,
    title: 'Smart Split Engine',
    description: 'Split expenses equally, by percentage, or custom amounts. Our AI suggests the fairest split every time.',
    color: 'from-blue-500 to-blue-600',
    bg: 'bg-blue-50',
  },
  {
    icon: Wallet,
    title: 'Shared Wallet',
    description: 'Pool money for groceries, utilities, and common expenses. Transparent tracking for every rupee.',
    color: 'from-green-500 to-emerald-600',
    bg: 'bg-green-50',
  },
  {
    icon: CreditCard,
    title: 'Payment Tracking',
    description: 'Track who paid what with UPI & QR payments. Instant settlement links and payment history.',
    color: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-50',
  },
  {
    icon: Shield,
    title: 'Credit Score',
    description: 'Internal credit scoring for financial accountability. Build trust within your room.',
    color: 'from-amber-500 to-orange-600',
    bg: 'bg-amber-50',
  },
  {
    icon: Banknote,
    title: 'Micro Loans',
    description: 'Quick loans between roommates with transparent interest tracking. Never lose a rupee.',
    color: 'from-rose-500 to-pink-600',
    bg: 'bg-rose-50',
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    description: 'Beautiful charts showing spending patterns and trends. Know exactly where your money goes.',
    color: 'from-cyan-500 to-teal-600',
    bg: 'bg-cyan-50',
  },
];

const steps = [
  { num: 1, title: 'Create a Room', desc: 'Set up your shared living space in under 30 seconds.' },
  { num: 2, title: 'Invite Roommates', desc: 'Share a code or link — they join instantly.' },
  { num: 3, title: 'Add Expenses', desc: 'Log bills, groceries, or any shared cost on the go.' },
  { num: 4, title: 'Auto-Split & Pay', desc: 'We calculate who owes whom and settle via UPI.' },
];

const testimonials = [
  {
    name: 'Arjun Mehta',
    initials: 'AM',
    color: 'bg-blue-500',
    role: 'IIT Bombay Student',
    quote:
      "BachelorsPay completely eliminated the awkward 'you owe me' conversations. Our flat of 4 runs like a well-oiled machine now.",
  },
  {
    name: 'Priya Sharma',
    initials: 'PS',
    color: 'bg-green-500',
    role: 'Working Professional, Bangalore',
    quote:
      "The analytics blew my mind — I finally understood where our grocery budget was actually going. Saved us ₹3,000/month!",
  },
  {
    name: 'Ravi Kumar',
    initials: 'RK',
    color: 'bg-violet-500',
    role: 'Startup Founder, Hyderabad',
    quote:
      "We use the shared wallet for our office snacks & supplies. The micro-loan feature is genius for quick cash-flow crunches.",
  },
];

const pricingPlans = [
  {
    name: 'Free',
    price: '₹0',
    period: 'forever',
    description: 'Perfect for getting started with your roommates.',
    features: [
      { text: 'Up to 4 roommates', included: true },
      { text: 'Basic expense splitting', included: true },
      { text: 'Payment tracking', included: true },
      { text: 'Monthly analytics', included: true },
      { text: 'Shared wallet', included: false },
      { text: 'Credit scoring', included: false },
      { text: 'Micro loans', included: false },
      { text: 'Priority support', included: false },
    ],
    cta: 'Get Started Free',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '₹199',
    period: '/month',
    description: 'Everything you need for a smooth shared life.',
    features: [
      { text: 'Up to 10 roommates', included: true },
      { text: 'Smart split engine', included: true },
      { text: 'Payment tracking + UPI', included: true },
      { text: 'Weekly analytics', included: true },
      { text: 'Shared wallet', included: true },
      { text: 'Credit scoring', included: true },
      { text: 'Micro loans', included: true },
      { text: 'Priority support', included: false },
    ],
    cta: 'Start Pro Trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Contact Us',
    period: '',
    description: 'For PG owners, hostels, and co-living spaces.',
    features: [
      { text: 'Unlimited rooms & members', included: true },
      { text: 'All Pro features', included: true },
      { text: 'Admin dashboard', included: true },
      { text: 'Real-time analytics', included: true },
      { text: 'Rent collection', included: true },
      { text: 'Custom integrations', included: true },
      { text: 'Dedicated account manager', included: true },
      { text: '24/7 priority support', included: true },
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

const faqs = [
  {
    q: 'Is BachelorsPay really free to use?',
    a: 'Yes! The Free plan gives you everything you need to split expenses with up to 4 roommates. No credit card required, no hidden fees.',
  },
  {
    q: 'How does the Smart Split Engine work?',
    a: 'Our algorithm takes into account individual shares, usage frequency, and custom rules you set. You can split equally, by percentage, by exact amounts, or even exclude specific people from a particular expense.',
  },
  {
    q: 'Is my financial data secure?',
    a: 'Absolutely. We use bank-grade AES-256 encryption, and your data is stored on SOC 2 compliant servers. We never share your data with third parties.',
  },
  {
    q: 'Can I use UPI for settlements?',
    a: 'Yes! BachelorsPay generates instant UPI payment links and QR codes so you can settle debts in seconds — directly from the app.',
  },
  {
    q: 'What happens if a roommate doesn\'t pay?',
    a: 'Our internal credit scoring tracks payment reliability. Persistent defaulters get gentle reminders, and their credit score reflects their payment behaviour — encouraging accountability.',
  },
  {
    q: 'Can I use this for a PG or hostel?',
    a: 'Definitely! Our Enterprise plan is designed for PG owners, hostel managers, and co-living operators with features like rent collection, admin dashboards, and more.',
  },
];

/* ────────────────────────────────────────────────────────
   NAVBAR
   ──────────────────────────────────────────────────────── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const links = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'glass shadow-lg shadow-black/5'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563EB] to-[#22C55E] shadow-md">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-[#0F172A]">
              Bachelors<span className="text-[#2563EB]">Pay</span>
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-slate-600 hover:text-[#2563EB] transition-colors"
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-700 hover:text-[#2563EB] transition-colors px-4 py-2"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:bg-[#1d4ed8] transition-all hover:shadow-blue-500/40"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile burger */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5 text-slate-700" />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden overflow-hidden glass border-t border-white/20"
          >
            <div className="px-4 py-4 space-y-3">
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className="block text-sm font-medium text-slate-600 hover:text-[#2563EB] py-2"
                >
                  {l.label}
                </a>
              ))}
              <div className="pt-2 flex flex-col gap-2">
                <Link
                  href="/login"
                  className="text-center text-sm font-medium text-slate-700 py-2.5 rounded-xl border border-slate-200"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="text-center rounded-xl bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

/* ────────────────────────────────────────────────────────
   FAQ ITEM
   ──────────────────────────────────────────────────────── */
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div variants={fadeUp} className="border-b border-slate-200">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-5 text-left"
      >
        <span className="text-base font-semibold text-[#0F172A] pr-4">{q}</span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-300 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm leading-relaxed text-slate-600">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════
   LANDING PAGE
   ════════════════════════════════════════════════════════ */
export default function LandingPage() {
  return (
    <main className="overflow-x-hidden">
      <Navbar />

      {/* ── HERO ──────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#EFF6FF] via-[#F8FAFC] to-[#ECFDF5] animate-gradient" />

        {/* Floating shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
          <div className="absolute top-20 left-[10%] h-72 w-72 rounded-full bg-blue-400/10 blur-3xl animate-float" />
          <div className="absolute bottom-32 right-[10%] h-96 w-96 rounded-full bg-green-400/10 blur-3xl animate-float-delayed" />
          <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-400/8 blur-3xl animate-float" />
          {/* Geometric accents */}
          <div className="absolute top-32 right-[20%] h-16 w-16 rounded-2xl border-2 border-blue-200/50 rotate-12 animate-float-delayed" />
          <div className="absolute bottom-40 left-[15%] h-12 w-12 rounded-full border-2 border-green-200/50 animate-float" />
          <div className="absolute top-[60%] right-[8%] h-10 w-10 rounded-lg border-2 border-violet-200/40 -rotate-12 animate-float-delayed" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Copy */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="text-center lg:text-left"
            >
              <motion.div
                variants={fadeUp}
                className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-100 px-4 py-1.5 text-xs font-semibold text-[#2563EB]"
              >
                <Zap className="h-3.5 w-3.5" />
                Trusted by 10,000+ roommates across India
              </motion.div>

              <motion.h1
                variants={fadeUp}
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#0F172A] leading-[1.1]"
              >
                Manage Your Room&apos;s Money{' '}
                <span className="gradient-text">Without the Drama</span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="mt-6 text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed"
              >
                The smartest way for roommates to split expenses, track bills, and
                manage shared finances. No more awkward money conversations.
              </motion.p>

              <motion.div
                variants={fadeUp}
                className="mt-8 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start"
              >
                <Link
                  href="/signup"
                  className="group flex items-center gap-2 rounded-full bg-[#2563EB] px-7 py-3.5 text-base font-semibold text-white shadow-xl shadow-blue-500/25 hover:bg-[#1d4ed8] hover:shadow-blue-500/40 transition-all"
                >
                  Create Free Room
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <a
                  href="#how-it-works"
                  className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-7 py-3.5 text-base font-semibold text-slate-700 hover:border-blue-200 hover:text-[#2563EB] transition-all"
                >
                  See How It Works
                </a>
              </motion.div>

              <motion.div
                variants={fadeUp}
                className="mt-8 flex items-center gap-6 justify-center lg:justify-start text-sm text-slate-500"
              >
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-[#22C55E]" /> Free forever
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-[#22C55E]" /> No credit card
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-[#22C55E]" /> 30s setup
                </span>
              </motion.div>
            </motion.div>

            {/* Mock dashboard preview */}
            <motion.div
              initial={{ opacity: 0, x: 60, rotateY: -8 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
              className="relative hidden lg:block"
            >
              <div className="relative rounded-2xl bg-white shadow-2xl shadow-slate-200/60 border border-slate-100 p-6 animate-pulse-glow">
                {/* Top bar */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Welcome back</p>
                    <p className="text-lg font-bold text-[#0F172A]">Room Dashboard</p>
                  </div>
                  <div className="flex -space-x-2">
                    {['bg-blue-500', 'bg-green-500', 'bg-violet-500', 'bg-amber-500'].map(
                      (c, i) => (
                        <div
                          key={i}
                          className={`h-8 w-8 rounded-full ${c} border-2 border-white flex items-center justify-center text-[10px] font-bold text-white`}
                        >
                          {['A', 'P', 'R', 'S'][i]}
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[
                    { label: 'Total Expenses', value: '₹24,500', change: '+12%', color: 'text-[#2563EB]' },
                    { label: 'You Owe', value: '₹1,250', change: '-₹800', color: 'text-rose-500' },
                    { label: 'Shared Wallet', value: '₹5,400', change: '+₹2k', color: 'text-[#22C55E]' },
                  ].map((s, i) => (
                    <div key={i} className="rounded-xl bg-slate-50 p-3">
                      <p className="text-[10px] text-slate-400 font-medium">{s.label}</p>
                      <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                      <p className="text-[10px] text-slate-400">{s.change} this month</p>
                    </div>
                  ))}
                </div>

                {/* Mini chart placeholder */}
                <div className="rounded-xl bg-gradient-to-r from-blue-50 to-green-50 p-4 mb-4">
                  <p className="text-xs font-semibold text-slate-600 mb-3">Spending Trend</p>
                  <div className="flex items-end gap-1.5 h-20">
                    {[40, 65, 45, 80, 55, 70, 90, 60, 75, 85, 50, 95].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t-sm bg-gradient-to-t from-[#2563EB] to-blue-400"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>

                {/* Recent activity */}
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-2">Recent Activity</p>
                  {[
                    { text: 'Groceries split 4 ways', amount: '-₹450', by: 'Arjun' },
                    { text: 'Electricity bill paid', amount: '-₹1,200', by: 'Priya' },
                    { text: 'Wallet top-up', amount: '+₹2,000', by: 'You' },
                  ].map((a, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                      <div>
                        <p className="text-xs font-medium text-slate-700">{a.text}</p>
                        <p className="text-[10px] text-slate-400">by {a.by}</p>
                      </div>
                      <p className={`text-xs font-semibold ${a.amount.startsWith('+') ? 'text-[#22C55E]' : 'text-slate-600'}`}>
                        {a.amount}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Decorative dots */}
              <div className="absolute -top-4 -right-4 h-24 w-24 opacity-20" aria-hidden>
                <div className="grid grid-cols-4 gap-2">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div key={i} className="h-2 w-2 rounded-full bg-[#2563EB]" />
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────── */}
      <Section
        id="features"
        className="py-24 sm:py-32 bg-white"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-semibold text-[#2563EB] tracking-wide uppercase mb-3">
              Powerful Features
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
              Everything you need to manage shared finances
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              From smart splitting to micro-loans — BachelorsPay has every tool to make living together financially stress-free.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="group relative rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-xl hover:shadow-slate-200/40 transition-shadow duration-300"
              >
                <div
                  className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${f.color} shadow-lg`}
                >
                  <f.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-[#0F172A] mb-2">{f.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── HOW IT WORKS ──────────────────────────────── */}
      <Section
        id="how-it-works"
        className="py-24 sm:py-32 bg-gradient-to-b from-[#F8FAFC] to-white"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-semibold text-[#22C55E] tracking-wide uppercase mb-3">
              Simple Process
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
              Get started in 4 easy steps
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              From signup to settlement — it takes less time than ordering food.
            </p>
          </motion.div>

          <div className="relative">
            {/* Timeline line – desktop only */}
            <div className="hidden lg:block absolute top-14 left-[calc(12.5%+24px)] right-[calc(12.5%+24px)] h-0.5 bg-gradient-to-r from-[#2563EB] via-[#22C55E] to-[#2563EB]" />

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {steps.map((s, i) => (
                <motion.div key={s.num} variants={fadeUp} className="relative text-center">
                  {/* Number circle */}
                  <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#2563EB] to-[#3b82f6] text-white text-xl font-bold shadow-lg shadow-blue-500/25 relative z-10">
                    {s.num}
                  </div>
                  <h3 className="text-lg font-bold text-[#0F172A] mb-2">{s.title}</h3>
                  <p className="text-sm text-slate-600">{s.desc}</p>

                  {/* Mobile connector */}
                  {i < steps.length - 1 && (
                    <div className="sm:hidden flex justify-center py-4">
                      <div className="h-8 w-0.5 bg-gradient-to-b from-[#2563EB] to-transparent" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ── STATS ─────────────────────────────────────── */}
      <Section className="py-20 bg-[#0F172A] relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute top-0 left-1/4 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-green-500/10 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { target: 10000, suffix: '+', label: 'Active Users', icon: Users },
              { target: 5, prefix: '₹', suffix: 'Cr+', label: 'Money Tracked', icon: TrendingUp },
              { target: 50000, suffix: '+', label: 'Splits Done', icon: Sparkles },
              { target: 4.9, suffix: '★', label: 'User Rating', icon: Star },
            ].map((s, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="text-center"
              >
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                  <s.icon className="h-6 w-6 text-[#22C55E]" />
                </div>
                <p className="text-3xl sm:text-4xl font-extrabold text-white">
                  {s.target === 4.9 ? (
                    <span>{s.target}{s.suffix}</span>
                  ) : (
                    <AnimatedCounter
                      target={s.target}
                      suffix={s.suffix}
                      prefix={s.prefix}
                    />
                  )}
                </p>
                <p className="mt-1 text-sm text-slate-400">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── TESTIMONIALS ──────────────────────────────── */}
      <Section className="py-24 sm:py-32 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-semibold text-[#2563EB] tracking-wide uppercase mb-3">
              Testimonials
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
              Loved by roommates everywhere
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <motion.div
                key={t.name}
                variants={fadeUp}
                whileHover={{ y: -4 }}
                className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-lg transition-shadow"
              >
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${t.color} text-sm font-bold text-white`}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0F172A]">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── PRICING ───────────────────────────────────── */}
      <Section
        id="pricing"
        className="py-24 sm:py-32 bg-gradient-to-b from-[#F8FAFC] to-white"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-semibold text-[#2563EB] tracking-wide uppercase mb-3">
              Pricing
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Start free and upgrade when you need more power. No hidden fees, ever.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 items-start">
            {pricingPlans.map((plan) => (
              <motion.div
                key={plan.name}
                variants={scaleIn}
                whileHover={{ y: -4 }}
                className={`relative rounded-2xl border p-6 transition-shadow ${
                  plan.highlighted
                    ? 'border-[#2563EB] bg-white shadow-xl shadow-blue-500/10 ring-1 ring-[#2563EB]'
                    : 'border-slate-100 bg-white shadow-sm hover:shadow-lg'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-gradient-to-r from-[#2563EB] to-blue-500 px-4 py-1 text-xs font-semibold text-white shadow-lg">
                      Most Popular
                    </span>
                  </div>
                )}

                <h3 className="text-lg font-bold text-[#0F172A]">{plan.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-[#0F172A]">{plan.price}</span>
                  {plan.period && (
                    <span className="text-sm text-slate-500">{plan.period}</span>
                  )}
                </div>
                <p className="mt-2 text-sm text-slate-600">{plan.description}</p>

                <ul className="mt-6 space-y-3">
                  {plan.features.map((feat) => (
                    <li key={feat.text} className="flex items-center gap-2.5 text-sm">
                      {feat.included ? (
                        <Check className="h-4 w-4 shrink-0 text-[#22C55E]" />
                      ) : (
                        <X className="h-4 w-4 shrink-0 text-slate-300" />
                      )}
                      <span className={feat.included ? 'text-slate-700' : 'text-slate-400'}>
                        {feat.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/signup"
                  className={`mt-6 block w-full rounded-xl py-3 text-center text-sm font-semibold transition-all ${
                    plan.highlighted
                      ? 'bg-[#2563EB] text-white shadow-lg shadow-blue-500/25 hover:bg-[#1d4ed8]'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── FAQ ────────────────────────────────────────── */}
      <Section id="faq" className="py-24 sm:py-32 bg-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} className="text-center mb-12">
            <p className="text-sm font-semibold text-[#2563EB] tracking-wide uppercase mb-3">
              FAQ
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
              Frequently asked questions
            </h2>
          </motion.div>

          <div>
            {faqs.map((faq) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </Section>

      {/* ── CTA BANNER ────────────────────────────────── */}
      <Section className="py-20 bg-gradient-to-r from-[#2563EB] to-[#1d4ed8] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-white/5" />
          <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-white/5" />
        </div>

        <div className="relative z-10 mx-auto max-w-3xl px-4 text-center">
          <motion.h2
            variants={fadeUp}
            className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight"
          >
            Ready to end the money drama?
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-lg text-blue-100">
            Join thousands of roommates who&apos;ve already simplified their shared finances.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-8">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-semibold text-[#2563EB] shadow-xl hover:shadow-2xl transition-all hover:scale-105"
            >
              Create Your Free Room
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </Section>

      {/* ── FOOTER ────────────────────────────────────── */}
      <footer className="bg-[#0F172A] text-white pt-16 pb-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-white/10">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563EB] to-[#22C55E]">
                  <Wallet className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold">
                  Bachelors<span className="text-[#2563EB]">Pay</span>
                </span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed mb-6 max-w-xs">
                The simplest way for roommates to manage shared finances. Split, track, and settle — hassle-free.
              </p>
              <div className="flex gap-3">
                {[Share2, MessageSquare, Globe, Wallet].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    aria-label="Social link"
                  >
                    <Icon className="h-4 w-4 text-slate-400" />
                  </a>
                ))}
              </div>
            </div>

            {/* Links */}
            {[
              {
                title: 'Product',
                links: ['Features', 'Pricing', 'Security', 'Changelog'],
              },
              {
                title: 'Company',
                links: ['About', 'Blog', 'Careers', 'Contact'],
              },
              {
                title: 'Legal',
                links: ['Privacy Policy', 'Terms of Service', 'Cookie Policy'],
              },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-sm font-semibold text-white mb-4">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-sm text-slate-400 hover:text-white transition-colors"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} BachelorsPay. All rights reserved.
            </p>
            <p className="text-sm text-slate-500">
              Made with <span className="text-red-400">❤️</span> in India
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
