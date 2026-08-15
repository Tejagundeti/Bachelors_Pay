'use client';

import React from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { 
  Bell, CheckSquare, Info, Clock, AlertCircle, ShoppingBag, 
  HandCoins, CreditCard, Sparkles, UserPlus
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function NotificationsPage() {
  const { 
    notifications, unreadCount, loading, error, hasMore, loadMore, markAsRead, markAllAsRead 
  } = useNotifications();

  // Map notification type to icon
  const getNotificationIcon = (type: string) => {
    const map: Record<string, React.ReactNode> = {
      EXPENSE_ADDED: <ShoppingBag className="w-5 h-5 text-blue-500" />,
      PAYMENT_RECEIVED: <CreditCard className="w-5 h-5 text-green-500" />,
      DUE_REMINDER: <AlertCircle className="w-5 h-5 text-rose-500" />,
      LOAN_REQUEST: <HandCoins className="w-5 h-5 text-violet-500" />,
      LOAN_APPROVED: <Sparkles className="w-5 h-5 text-amber-500" />,
      LOAN_REJECTED: <AlertCircle className="w-5 h-5 text-red-500" />,
      ROOM_INVITE: <UserPlus className="w-5 h-5 text-cyan-500" />,
      MEMBER_JOINED: <UserPlus className="w-5 h-5 text-green-500" />,
    };

    return map[type] ?? <Bell className="w-5 h-5 text-slate-400" />;
  };

  const handleNotificationClick = async (id: string, isRead: boolean) => {
    if (!isRead) {
      try {
        await markAsRead([id]);
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse bg-gray-200 h-8 w-48 rounded-xl" />
        <div className="animate-pulse bg-gray-200 h-[400px] rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] flex items-center gap-2">
            <Bell className="w-8 h-8 text-[#2563EB]" /> Notifications
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Stay updated with room activities ({unreadCount} unread).
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:border-[#2563EB] rounded-xl text-xs font-semibold text-slate-700 hover:text-[#2563EB] transition-colors shadow-sm bg-white"
          >
            <CheckSquare className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      {/* Main notifications list */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
        {notifications.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <Info className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm text-slate-400">All caught up! No notifications.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n.id, n.isRead)}
                className={`
                  p-4 flex items-start gap-4 rounded-2xl transition-all cursor-pointer select-none
                  ${n.isRead ? 'hover:bg-slate-50/50' : 'bg-blue-50/20 border border-blue-50/20 hover:bg-blue-50/30'}
                `}
              >
                {/* Icon wrapper */}
                <div className={`p-2.5 rounded-xl shrink-0 ${n.isRead ? 'bg-slate-50' : 'bg-white shadow-sm'}`}>
                  {getNotificationIcon(n.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className={`text-sm ${n.isRead ? 'text-slate-700 font-medium' : 'text-slate-900 font-bold'}`}>
                      {n.title}
                    </h4>
                    {!n.isRead && (
                      <span className="w-2 h-2 bg-blue-600 rounded-full shrink-0 animate-pulse" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{n.message}</p>
                  
                  <p className="text-[10px] text-slate-400 font-medium mt-1.5 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(n.createdAt).toLocaleDateString('en-IN')} at {new Date(n.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {/* Load More Button */}
            {hasMore && (
              <div className="pt-4 flex justify-center">
                <button
                  onClick={loadMore}
                  className="px-5 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                >
                  Load More
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
