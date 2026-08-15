'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Wallet, Lock, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

function ResetPasswordFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Password reset token is missing or invalid.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter.');
      return;
    }

    if (!/[0-9]/.test(password)) {
      setError('Password must contain at least one number.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password.');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <div className="flex items-center justify-center p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-100 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="ml-2 font-medium">Invalid or missing reset token.</span>
        </div>
        <p className="text-xs text-slate-500">Please request a new password reset link from the forgot password page.</p>
        <Link
          href="/forgot-password"
          className="inline-block mt-2 text-xs font-semibold text-blue-600 hover:underline"
        >
          Request new reset link
        </Link>
      </div>
    );
  }

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

      {success && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="flex items-start gap-2.5 p-3.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 text-sm"
        >
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
          <span>Password reset successful! Redirecting to login...</span>
        </motion.div>
      )}

      {/* Password Field */}
      <div className="space-y-1.5">
        <label htmlFor="password" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          New Password
        </label>
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

      {/* Confirm Password Field */}
      <div className="space-y-1.5">
        <label htmlFor="confirmPassword" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Confirm Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            id="confirmPassword"
            type="password"
            required
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
        disabled={loading || success}
        className="
          group w-full flex items-center justify-center gap-2 py-3.5 rounded-xl
          bg-[#2563EB] text-white text-sm font-semibold shadow-lg shadow-blue-500/25
          hover:bg-[#1d4ed8] hover:shadow-blue-500/40 focus:outline-none
          transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none
        "
      >
        {loading ? 'Resetting password...' : 'Reset Password'}
        {!loading && !success && <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden bg-gradient-to-br from-[#EFF6FF] via-[#F8FAFC] to-[#ECFDF5]">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-[-10%] left-[-10%] h-[35rem] w-[35rem] rounded-full bg-blue-400/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[40rem] w-[40rem] rounded-full bg-emerald-400/10 blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md animate-fade-in"
      >
        {/* Logo Header */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-2 mb-3 group">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-[#2563EB] to-[#22C55E] rounded-2xl shadow-xl shadow-blue-500/25 group-hover:scale-105 transition-transform duration-300">
              <Wallet className="w-6 h-6 text-white" />
            </div>
          </Link>
          <h2 className="text-3xl font-extrabold text-[#0F172A] tracking-tight">Create New Password</h2>
          <p className="text-sm text-slate-500 mt-2">Enter a secure password for your account</p>
        </div>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-3xl p-8 shadow-2xl shadow-slate-200/50">
          <Suspense fallback={<div className="text-center py-4 text-sm text-slate-400">Loading form...</div>}>
            <ResetPasswordFormContent />
          </Suspense>
        </div>
      </motion.div>
    </div>
  );
}
