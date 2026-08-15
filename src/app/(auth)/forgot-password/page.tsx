'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Wallet, Mail, ArrowRight, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send reset link.');
      }

      setSuccessMessage(data.message || 'Reset link has been sent to your email.');
      setEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
          <h2 className="text-3xl font-extrabold text-[#0F172A] tracking-tight">Reset Password</h2>
          <p className="text-sm text-slate-500 mt-2">Get back into your Room Finance account</p>
        </div>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-3xl p-8 shadow-2xl shadow-slate-200/50">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-100 text-sm mb-5"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          {successMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex items-start gap-2.5 p-3.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 text-sm mb-5"
            >
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMessage}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
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
              {loading ? 'Sending link...' : 'Send Reset Link'}
              {!loading && <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex py-5 items-center">
            <div className="flex-grow border-t border-slate-100"></div>
          </div>

          <div className="text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#2563EB] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
