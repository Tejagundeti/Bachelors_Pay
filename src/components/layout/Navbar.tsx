'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  Search,
  Bell,
  ChevronDown,
  LogOut,
  User,
  Settings,
  Wallet,
} from 'lucide-react';

interface NavbarProps {
  onMenuToggle: () => void;
}

export default function Navbar({ onMenuToggle }: NavbarProps) {
  const { data: session } = useSession();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const profileRef = useRef<HTMLDivElement>(null);

  // Fetch unread notification count
  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch('/api/notifications');
        if (res.ok) {
          const data = await res.json();
          const unread = Array.isArray(data)
            ? data.filter((n: { isRead: boolean }) => !n.isRead).length
            : data.unreadCount ?? 0;
          setUnreadCount(unread);
        }
      } catch {
        // Silently fail – badge just won't show
      }
    }
    fetchNotifications();
  }, []);

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const userName = session?.user?.name ?? 'User';
  const userEmail = session?.user?.email ?? '';
  const userImage = session?.user?.image;

  // Build initials for fallback avatar
  const initials = userName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="fixed top-0 inset-x-0 z-40 h-16 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 shadow-sm">
      <div className="flex items-center justify-between h-full px-4 lg:px-6 max-w-[1920px] mx-auto">
        {/* ─── Left: Hamburger + Logo ─── */}
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5 text-gray-700" />
          </button>

          {/* Brand */}
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] rounded-lg shadow-md shadow-blue-500/25">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-[#2563EB] to-[#0F172A] bg-clip-text text-transparent hidden sm:inline">
              BachelorsPay
            </span>
          </Link>
        </div>

        {/* ─── Center: Search bar (desktop) ─── */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search transactions, members..."
              className="
                w-full pl-10 pr-4 py-2 rounded-xl
                bg-gray-50 border border-gray-200
                text-sm text-gray-700 placeholder-gray-400
                focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]
                transition-all duration-200
              "
            />
          </div>
        </div>

        {/* ─── Right: Notifications + Profile ─── */}
        <div className="flex items-center gap-2">
          {/* Notification bell */}
          <Link
            href="/notifications"
            className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="
                  absolute -top-0.5 -right-0.5
                  flex items-center justify-center
                  min-w-[18px] h-[18px] px-1
                  bg-red-500 text-white text-[10px] font-bold
                  rounded-full ring-2 ring-white
                "
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </motion.span>
            )}
          </Link>

          {/* Profile dropdown */}
          <div ref={profileRef} className="relative">
            <button
              onClick={() => setIsProfileOpen((prev) => !prev)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
              aria-label="User menu"
            >
              {/* Avatar */}
              {userImage ? (
                <img
                  src={userImage}
                  alt={userName}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-gray-200"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center text-white text-xs font-bold ring-2 ring-gray-200">
                  {initials}
                </div>
              )}
              <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[120px] truncate">
                {userName}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                  isProfileOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown */}
            <AnimatePresence>
              {isProfileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="
                    absolute right-0 mt-2 w-64
                    bg-white rounded-xl shadow-xl border border-gray-100
                    overflow-hidden z-50
                  "
                >
                  {/* User info header */}
                  <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {userName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                  </div>

                  {/* Links */}
                  <div className="py-1">
                    <DropdownLink
                      href="/profile"
                      icon={<User className="w-4 h-4" />}
                      label="Profile"
                      onClick={() => setIsProfileOpen(false)}
                    />
                    <DropdownLink
                      href="/settings"
                      icon={<Settings className="w-4 h-4" />}
                      label="Settings"
                      onClick={() => setIsProfileOpen(false)}
                    />
                  </div>

                  {/* Logout */}
                  <div className="border-t border-gray-100 py-1">
                    <button
                      onClick={() => signOut({ callbackUrl: '/login' })}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log out</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}

/** Reusable dropdown link item */
function DropdownLink({
  href,
  icon,
  label,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
    >
      <span className="text-gray-400">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}
