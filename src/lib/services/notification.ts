/**
 * Notification Service
 *
 * Manages in-app notifications — create, bulk-create, mark-read, and
 * retrieve unread counts.  Notification rows live in the `Notification`
 * table and reference a `NotificationType` enum from Prisma.
 */

import prisma from '../prisma';
import { NotificationType, Prisma } from '@prisma/client';

// ─── Core CRUD ───────────────────────────────────────────────────────────────

/**
 * Create a single notification for one user.
 */
export async function createNotification({
  userId,
  type,
  title,
  message,
  data,
}: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}) {
  return prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      data: data as Prisma.InputJsonValue,
    },
  });
}

/**
 * Send the same notification to many users at once.
 *
 * Uses `createMany` for a single round-trip to the DB.
 */
export async function createBulkNotifications(
  userIds: string[],
  type: NotificationType,
  title: string,
  message: string,
  data?: Record<string, unknown>,
) {
  if (userIds.length === 0) return { count: 0 };

  return prisma.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      type,
      title,
      message,
      data: data as Prisma.InputJsonValue,
    })),
  });
}

// ─── Read / Unread ───────────────────────────────────────────────────────────

/**
 * Count how many unread notifications a user has (for badge UI).
 */
export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { userId, isRead: false },
  });
}

/**
 * Mark specific notifications as read.
 */
export async function markAsRead(notificationIds: string[]) {
  if (notificationIds.length === 0) return { count: 0 };

  return prisma.notification.updateMany({
    where: { id: { in: notificationIds } },
    data: { isRead: true },
  });
}

/**
 * Mark every unread notification for a user as read.
 */
export async function markAllAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}

// ─── Paginated Fetch ─────────────────────────────────────────────────────────

/**
 * Fetch notifications for a user with optional pagination and filter.
 */
export async function getNotifications(
  userId: string,
  opts: {
    take?: number;
    skip?: number;
    unreadOnly?: boolean;
    type?: NotificationType;
  } = {},
) {
  const { take = 20, skip = 0, unreadOnly = false, type } = opts;

  const where: Record<string, unknown> = { userId };
  if (unreadOnly) where.isRead = false;
  if (type) where.type = type;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    }),
    prisma.notification.count({ where }),
  ]);

  return { notifications, total, hasMore: skip + take < total };
}

// ─── Convenience Factories ───────────────────────────────────────────────────
// These wrap `createNotification` with pre-filled types / templates so callers
// don't have to remember the enum values.

export async function notifyExpenseAdded(
  userId: string,
  expenseTitle: string,
  amount: number,
  paidByName: string,
) {
  return createNotification({
    userId,
    type: 'EXPENSE' as NotificationType,
    title: 'New Expense Added',
    message: `${paidByName} added "${expenseTitle}" for ₹${amount.toFixed(2)}`,
    data: { expenseTitle, amount, paidByName },
  });
}

export async function notifyPaymentReminder(
  userId: string,
  amount: number,
  dueDate: string,
) {
  return createNotification({
    userId,
    type: 'PAYMENT' as NotificationType,
    title: 'Payment Reminder',
    message: `You have a pending payment of ₹${amount.toFixed(2)} due on ${dueDate}`,
    data: { amount, dueDate },
  });
}

export async function notifyPaymentReceived(
  userId: string,
  amount: number,
  fromName: string,
) {
  return createNotification({
    userId,
    type: 'PAYMENT' as NotificationType,
    title: 'Payment Received',
    message: `${fromName} paid you ₹${amount.toFixed(2)}`,
    data: { amount, fromName },
  });
}

export async function notifyLoanRequest(
  userId: string,
  requesterName: string,
  amount: number,
) {
  return createNotification({
    userId,
    type: 'LOAN' as NotificationType,
    title: 'Loan Request',
    message: `${requesterName} requested a loan of ₹${amount.toFixed(2)}`,
    data: { requesterName, amount },
  });
}

export async function notifyLoanApproved(
  userId: string,
  amount: number,
  approverName: string,
) {
  return createNotification({
    userId,
    type: 'LOAN' as NotificationType,
    title: 'Loan Approved',
    message: `${approverName} approved your loan of ₹${amount.toFixed(2)}`,
    data: { amount, approverName },
  });
}

export async function notifyCreditScoreChange(
  userId: string,
  oldScore: number,
  newScore: number,
  reason: string,
) {
  const direction = newScore > oldScore ? 'increased' : 'decreased';
  const diff = Math.abs(newScore - oldScore);

  return createNotification({
    userId,
    type: 'SYSTEM' as NotificationType,
    title: 'Credit Score Update',
    message: `Your credit score ${direction} by ${diff} points (${reason})`,
    data: { oldScore, newScore, reason },
  });
}
