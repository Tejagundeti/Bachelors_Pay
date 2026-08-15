'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Wallet, Mail, Lock, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const authError = searchParams.get('error');
  const urlError = authError === 'CredentialsSignin'
    ? 'Invalid email or password. Please try again.'
    : authError
      ? 'An error occurred during authentication. Please try again.'
      : null;

  const error = submitError || urlError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setSubmitError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setSubmitError(null);

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setSubmitError('Invalid email or password.');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setSubmitError('Something went wrong. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-100 text-sm"
        >
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </motion.div>
      )}

      {/* Email Field */}
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            id="email"
            type="email"
            required
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="
              w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white
              text-sm text-slate-800 placeholder-slate-400
              focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
              transition-all duration-200
            "
          />
        </div>
      </div>

      {/* Password Field */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Password
          </label>
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            Forgot Password?
          </Link>
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            id="password"
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="
              w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white
              text-sm text-slate-800 placeholder-slate-400
              focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
              transition-all duration-200
            "
          />
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="
          group w-full flex items-center justify-center gap-2 py-3.5 rounded-xl
          bg-[#2563EB] text-white text-sm font-semibold shadow-lg shadow-blue-500/25
          hover:bg-[#1d4ed8] hover:shadow-blue-500/40 focus:outline-none
          transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none
        "
      >
        {loading ? 'Logging in...' : 'Log In'}
        {!loading && <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden bg-gradient-to-br from-[#EFF6FF] via-[#F8FAFC] to-[#ECFDF5]">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-[-10%] left-[-10%] h-[35rem] w-[35rem] rounded-full bg-blue-400/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[40rem] w-[40rem] rounded-full bg-emerald-400/10 blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        {/* Logo Header */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-2 mb-3 group">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-[#2563EB] to-[#22C55E] rounded-2xl shadow-xl shadow-blue-500/25 group-hover:scale-105 transition-transform duration-300">
              <Wallet className="w-6 h-6 text-white" />
            </div>
          </Link>
          <h2 className="text-3xl font-extrabold text-[#0F172A] tracking-tight">Welcome back</h2>
          <p className="text-sm text-slate-500 mt-2">Simplify your roommate finances today</p>
        </div>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-3xl p-8 shadow-2xl shadow-slate-200/50">
          <Suspense fallback={<div className="text-center py-4 text-sm text-slate-400">Loading form...</div>}>
            <LoginFormContent />
          </Suspense>

          {/* Divider */}
          <div className="relative flex py-5 items-center">
            <div className="flex-grow border-t border-slate-100"></div>
            <span className="flex-shrink mx-4 text-xs text-slate-400 font-medium">Or try credentials</span>
            <div className="flex-grow border-t border-slate-100"></div>
          </div>

          {/* Quick Demo Info */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs text-slate-500 space-y-1">
            <p className="font-semibold text-slate-700 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Demo Credentials:
            </p>
            <p>• Email: <code className="bg-slate-200/50 px-1 rounded font-semibold text-slate-800">rahul@example.com</code></p>
            <p>• Password: <code className="bg-slate-200/50 px-1 rounded font-semibold text-slate-800">Password123!</code></p>
          </div>
        </div>

        {/* Footer Link */}
        <p className="text-center text-sm text-slate-500 mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
            Create Account
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
