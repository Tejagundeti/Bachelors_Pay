'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Home,
  Receipt,
  Wallet,
  CreditCard,
  BarChart3,
  HandCoins,
  Bell,
  User,
  Settings,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/room', label: 'Room', icon: Home },
  { href: '/expenses', label: 'Expenses', icon: Receipt },
  { href: '/wallet', label: 'Wallet', icon: Wallet },
  { href: '/payments', label: 'Payments', icon: CreditCard },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/loans', label: 'Loans', icon: HandCoins },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/settings', label: 'Settings', icon: Settings },
];

/** Sidebar navigation content shared between desktop and mobile views */
function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
      {/* Header - shown on mobile only */}
      {onClose && (
        <div className="flex items-center justify-between px-5 pt-5 pb-2 lg:hidden">
          <span className="text-lg font-bold text-[#0F172A]">Menu</span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      )}

      {/* Navigation links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive =
            pathname === link.href ||
            (link.href !== '/dashboard' && pathname.startsWith(link.href + '/'));

          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className={`
                group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-200 relative overflow-hidden
                ${
                  isActive
                    ? 'bg-[#2563EB] text-white shadow-lg shadow-blue-500/25'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-[#0F172A]'
                }
              `}
            >
              {/* Active indicator glow */}
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-[#2563EB] rounded-xl -z-10"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}

              <Icon
                className={`w-5 h-5 flex-shrink-0 transition-transform duration-200
                  ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-[#2563EB]'}
                  group-hover:scale-110
                `}
              />
              <span>{link.label}</span>

              {/* Subtle right-edge indicator for active link */}
              {isActive && (
                <motion.div
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white/40 rounded-l-full"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer version tag */}
      <div className="px-5 py-4 border-t border-gray-100">
        <p className="text-xs text-gray-400 text-center">BachelorsPay v1.0</p>
      </div>
    </div>
  );
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* ─── Desktop Sidebar (always visible on lg+) ─── */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:top-16 lg:left-0 lg:z-30 bg-white border-r border-gray-200/80">
        <SidebarContent />
      </aside>

      {/* ─── Mobile Sidebar Overlay ─── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="sidebar-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
              onClick={onClose}
            />

            {/* Drawer */}
            <motion.aside
              key="sidebar-drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="
                fixed inset-y-0 left-0 z-50 w-72
                bg-white/80 backdrop-blur-xl border-r border-white/20
                shadow-2xl lg:hidden
              "
            >
              <SidebarContent onClose={onClose} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
