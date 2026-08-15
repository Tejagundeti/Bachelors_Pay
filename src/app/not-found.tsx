'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Wallet, AlertCircle, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden bg-gradient-to-br from-[#EFF6FF] via-[#F8FAFC] to-[#ECFDF5]">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-[-10%] left-[-10%] h-[35rem] w-[35rem] rounded-full bg-blue-400/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[40rem] w-[40rem] rounded-full bg-emerald-400/10 blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md text-center relative z-10"
      >
        <div className="flex flex-col items-center">
          {/* Logo */}
          <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#2563EB] to-[#22C55E] rounded-3xl shadow-xl shadow-blue-500/25 mb-6">
            <Wallet className="w-8 h-8 text-white" />
          </div>

          {/* 404 Glass Card */}
          <div className="w-full bg-white/80 backdrop-blur-xl border border-white/40 rounded-3xl p-8 shadow-2xl shadow-slate-200/50 space-y-6">
            <div className="space-y-2">
              <span className="text-sm font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-3.5 py-1 rounded-full inline-flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" /> 404
              </span>
              <h2 className="text-2xl font-extrabold text-[#0F172A] mt-3">Page Not Found</h2>
              <p className="text-slate-500 text-xs leading-relaxed">
                The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Link
                href="/dashboard"
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-bold shadow-lg shadow-blue-500/20 transition-all duration-200"
              >
                <Home className="w-4 h-4" /> Go to Dashboard
              </Link>
              <Link
                href="/"
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all duration-200"
              >
                <ArrowLeft className="w-4 h-4" /> Go to Home
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
