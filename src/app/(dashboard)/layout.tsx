'use client';

import React, { useState } from 'react';
import { SessionProvider } from 'next-auth/react';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';

/**
 * Dashboard layout wraps all authenticated pages.
 * Provides the persistent Navbar + Sidebar chrome and scrollable main area.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <SessionProvider>
      <div className="min-h-screen bg-[#F8FAFC]">
        {/* Fixed top navbar */}
        <Navbar onMenuToggle={() => setSidebarOpen((prev) => !prev)} />

        {/* Sidebar (fixed on desktop, overlay on mobile) */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main content – offset by navbar height (h-16 = 4rem) and sidebar width on desktop */}
        <main className="pt-16 lg:pl-64 min-h-screen">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </SessionProvider>
  );
}
