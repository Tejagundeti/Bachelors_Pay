'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  data?: Record<string, unknown> | null;
  createdAt: string;
}

export interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
  markAsRead: (notificationIds: string[]) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;
/** Poll for new unread count every 30 seconds. */
const POLL_INTERVAL_MS = 30_000;

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const pageRef = useRef(1);

  /** Fetch the first page of notifications. */
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      pageRef.current = 1;

      const params = new URLSearchParams({
        page: '1',
        limit: PAGE_SIZE.toString(),
      });

      const res = await fetch(`/api/notifications?${params}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed to fetch notifications (${res.status})`);
      }

      const data = await res.json();
      setNotifications(data.notifications ?? data);
      setUnreadCount(data.unreadCount ?? 0);
      setHasMore(data.hasMore ?? false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch notifications';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  /** Append the next page of notifications. */
  const loadMore = useCallback(async () => {
    if (!hasMore) return;

    try {
      pageRef.current += 1;
      const params = new URLSearchParams({
        page: pageRef.current.toString(),
        limit: PAGE_SIZE.toString(),
      });

      const res = await fetch(`/api/notifications?${params}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to load more notifications');
      }

      const data = await res.json();
      const newItems: Notification[] = data.notifications ?? data;
      setNotifications((prev) => [...prev, ...newItems]);
      setHasMore(data.hasMore ?? false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load more';
      setError(message);
    }
  }, [hasMore]);

  /** Fetch only the unread count (lightweight poll). */
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/unread-count');
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count ?? 0);
      }
    } catch {
      // Silently swallow — polling errors shouldn't disrupt the UI
    }
  }, []);

  // Initial load
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotifications();
  }, [fetchNotifications]);

  // Poll unread count
  useEffect(() => {
    const interval = setInterval(fetchUnreadCount, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  /** Mark specific notifications as read. */
  const markAsRead = useCallback(
    async (notificationIds: string[]): Promise<void> => {
      if (notificationIds.length === 0) return;

      const res = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to mark as read');
      }

      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) =>
          notificationIds.includes(n.id) ? { ...n, isRead: true } : n,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - notificationIds.length));
    },
    [],
  );

  /** Mark all notifications as read. */
  const markAllAsRead = useCallback(async (): Promise<void> => {
    const res = await fetch('/api/notifications/mark-all-read', {
      method: 'POST',
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || 'Failed to mark all as read');
    }

    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    hasMore,
    refetch: fetchNotifications,
    loadMore,
    markAsRead,
    markAllAsRead,
  };
}

export default useNotifications;
