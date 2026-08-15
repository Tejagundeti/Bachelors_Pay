import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with conflict resolution.
 * Uses clsx for conditional class names and tailwind-merge to
 * deduplicate / resolve conflicting Tailwind utilities.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as Indian Rupees (₹).
 * Example: 1234.5 → "₹1,234.50"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a date as a human-readable string.
 * Example: "Jan 15, 2024"
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
}

/**
 * Format a date as a relative time string.
 * Examples: "2 hours ago", "3 days ago", "just now"
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSeconds < 60) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  if (diffWeeks < 5) return `${diffWeeks} week${diffWeeks === 1 ? '' : 's'} ago`;
  if (diffMonths < 12) return `${diffMonths} month${diffMonths === 1 ? '' : 's'} ago`;
  return `${diffYears} year${diffYears === 1 ? '' : 's'} ago`;
}

/**
 * Generate a random 8-character alphanumeric room code.
 * Uses uppercase letters and digits only for easy readability.
 */
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // excludes I,O,0,1 to avoid confusion
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Generate a random 6-character invite code.
 */
export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Extract initials from a name string.
 * "John Doe" → "JD", "Alice" → "A", "" → "?"
 */
export function getInitials(name: string): string {
  if (!name || name.trim().length === 0) return '?';

  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Map an expense category to a Lucide icon name.
 */
export function getCategoryIcon(category: string): string {
  const iconMap: Record<string, string> = {
    RENT: 'Home',
    ELECTRICITY: 'Zap',
    WATER: 'Droplets',
    INTERNET: 'Wifi',
    GROCERIES: 'ShoppingCart',
    GAS: 'Flame',
    CLEANING: 'SprayCan',
    FOOD: 'UtensilsCrossed',
    MAINTENANCE: 'Wrench',
    OTHER: 'MoreHorizontal',
  };
  return iconMap[category] ?? 'MoreHorizontal';
}

/**
 * Map an expense category to a Tailwind color class.
 */
export function getCategoryColor(category: string): string {
  const colorMap: Record<string, string> = {
    RENT: 'bg-blue-100 text-blue-700',
    ELECTRICITY: 'bg-yellow-100 text-yellow-700',
    WATER: 'bg-cyan-100 text-cyan-700',
    INTERNET: 'bg-purple-100 text-purple-700',
    GROCERIES: 'bg-green-100 text-green-700',
    GAS: 'bg-orange-100 text-orange-700',
    CLEANING: 'bg-teal-100 text-teal-700',
    FOOD: 'bg-red-100 text-red-700',
    MAINTENANCE: 'bg-gray-100 text-gray-700',
    OTHER: 'bg-slate-100 text-slate-700',
  };
  return colorMap[category] ?? 'bg-slate-100 text-slate-700';
}

/**
 * Map a status string to a Tailwind color class.
 * Works for payment statuses, loan statuses, etc.
 */
export function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    // Payment statuses
    PENDING: 'bg-amber-100 text-amber-700',
    SUCCESS: 'bg-green-100 text-green-700',
    FAILED: 'bg-red-100 text-red-700',
    // Loan statuses
    APPROVED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
    REPAID: 'bg-blue-100 text-blue-700',
    OVERDUE: 'bg-rose-100 text-rose-700',
    // Generic
    ACTIVE: 'bg-green-100 text-green-700',
    INACTIVE: 'bg-gray-100 text-gray-700',
  };
  return colorMap[status] ?? 'bg-gray-100 text-gray-700';
}
