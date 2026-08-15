'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Wallet, Mail, Lock, User, Phone, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone: phone || undefined }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details) {
          setFieldErrors(data.details);
          setError('Validation failed. Please check the fields below.');
        } else {
          setError(data.error || 'Something went wrong. Please try again.');
        }
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } catch {
      setError('Failed to reach server. Please try again later.');
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
        className="w-full max-w-md my-8"
      >
        {/* Logo Header */}
        <div className="flex flex-col items-center mb-6">
          <Link href="/" className="flex items-center gap-2 mb-3 group">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-[#2563EB] to-[#22C55E] rounded-2xl shadow-xl shadow-blue-500/25 group-hover:scale-105 transition-transform duration-300">
              <Wallet className="w-6 h-6 text-white" />
            </div>
          </Link>
          <h2 className="text-3xl font-extrabold text-[#0F172A] tracking-tight">Create your account</h2>
          <p className="text-sm text-slate-500 mt-2">Get started with BachelorsPay in under 30 seconds</p>
        </div>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-3xl p-8 shadow-2xl shadow-slate-200/50">
          {success ? (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-6 space-y-4"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-50 rounded-full border border-green-200 mb-2">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Registration Successful!</h3>
              <p className="text-sm text-slate-500">
                Your account has been created. Redirecting to login page...
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
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

              {/* Name Field */}
              <div className="space-y-1">
                <label htmlFor="name" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    id="name"
                    type="text"
                    required
                    placeholder="Rahul Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="
                      w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white
                      text-sm text-slate-800 placeholder-slate-400
                      focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                      transition-all duration-200
                    "
                  />
                </div>
                {fieldErrors.name && (
                  <p className="text-xs text-rose-500 mt-1">{fieldErrors.name[0]}</p>
                )}
              </div>

              {/* Email Field */}
              <div className="space-y-1">
                <label htmlFor="email" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Email Address <span className="text-rose-500">*</span>
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
                      w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white
                      text-sm text-slate-800 placeholder-slate-400
                      focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                      transition-all duration-200
                    "
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-xs text-rose-500 mt-1">{fieldErrors.email[0]}</p>
                )}
              </div>

              {/* Phone Field */}
              <div className="space-y-1">
                <label htmlFor="phone" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    id="phone"
                    type="tel"
                    placeholder="+919876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="
                      w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white
                      text-sm text-slate-800 placeholder-slate-400
                      focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                      transition-all duration-200
                    "
                  />
                </div>
                {fieldErrors.phone && (
                  <p className="text-xs text-rose-500 mt-1">{fieldErrors.phone[0]}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-1">
                <label htmlFor="password" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    id="password"
                    type="password"
                    required
                    placeholder="Min 8 chars, 1 capital, 1 number"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="
                      w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white
                      text-sm text-slate-800 placeholder-slate-400
                      focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                      transition-all duration-200
                    "
                  />
                </div>
                {fieldErrors.password && (
                  <p className="text-xs text-rose-500 mt-1">{fieldErrors.password[0]}</p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-1">
                <label htmlFor="confirmPassword" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Confirm Password <span className="text-rose-500">*</span>
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
                      w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white
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
                {loading ? 'Creating Account...' : 'Sign Up'}
                {!loading && <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />}
              </button>
            </form>
          )}
        </div>

        {/* Footer Link */}
        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
            Log In
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
