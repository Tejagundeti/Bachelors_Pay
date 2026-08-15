// ─── App Info ────────────────────────────────────────────────────────────────

export const APP_NAME = 'BachelorsPay';

export const APP_DESCRIPTION =
  'Smart roommate finance management — split expenses, track wallets, and settle up effortlessly.';

// ─── Expense Categories ──────────────────────────────────────────────────────

export const EXPENSE_CATEGORIES = [
  { label: 'Rent', value: 'RENT', icon: 'Home', color: '#3B82F6' },
  { label: 'Electricity', value: 'ELECTRICITY', icon: 'Zap', color: '#EAB308' },
  { label: 'Water', value: 'WATER', icon: 'Droplets', color: '#06B6D4' },
  { label: 'Internet', value: 'INTERNET', icon: 'Wifi', color: '#8B5CF6' },
  { label: 'Groceries', value: 'GROCERIES', icon: 'ShoppingCart', color: '#22C55E' },
  { label: 'Gas', value: 'GAS', icon: 'Flame', color: '#F97316' },
  { label: 'Cleaning', value: 'CLEANING', icon: 'SprayCan', color: '#14B8A6' },
  { label: 'Food', value: 'FOOD', icon: 'UtensilsCrossed', color: '#EF4444' },
  { label: 'Maintenance', value: 'MAINTENANCE', icon: 'Wrench', color: '#6B7280' },
  { label: 'Other', value: 'OTHER', icon: 'MoreHorizontal', color: '#94A3B8' },
] as const;

// ─── Payment Methods ─────────────────────────────────────────────────────────

export const PAYMENT_METHODS = [
  { label: 'UPI', value: 'UPI', icon: 'Smartphone' },
  { label: 'QR Code', value: 'QR', icon: 'QrCode' },
  { label: 'Bank Transfer', value: 'BANK_TRANSFER', icon: 'Building2' },
  { label: 'Cash', value: 'CASH', icon: 'Banknote' },
  { label: 'Wallet', value: 'WALLET', icon: 'Wallet' },
  { label: 'Razorpay', value: 'RAZORPAY', icon: 'CreditCard' },
] as const;

// ─── Split Types ─────────────────────────────────────────────────────────────

export const SPLIT_TYPES = [
  {
    label: 'Equal',
    value: 'EQUAL',
    description: 'Split equally among all selected members',
  },
  {
    label: 'Custom',
    value: 'CUSTOM',
    description: 'Enter exact amounts for each member',
  },
  {
    label: 'Percentage',
    value: 'PERCENTAGE',
    description: 'Enter percentage share for each member',
  },
  {
    label: 'Manual',
    value: 'MANUAL',
    description: 'Manually assign arbitrary amounts',
  },
] as const;

// ─── Credit Score ────────────────────────────────────────────────────────────

export const CREDIT_SCORE_CONFIG = {
  /** Absolute minimum credit score */
  min: 300,
  /** Absolute maximum credit score */
  max: 900,
  /** Default score for new users */
  default: 700,
  /** Points added for an on-time payment */
  onTimeBonus: 5,
  /** Points deducted for a late (but resolved) payment */
  latePaymentPenalty: 10,
  /** Points deducted for an overdue / unresolved payment */
  overduePaymentPenalty: 25,
  /** Minimum score required to request a loan */
  minForLoan: 500,
} as const;

// ─── Notification Types ──────────────────────────────────────────────────────

export const NOTIFICATION_TYPES = {
  EXPENSE_ADDED: {
    label: 'Expense Added',
    description: 'A new expense has been added to your room',
    icon: 'Receipt',
  },
  PAYMENT_RECEIVED: {
    label: 'Payment Received',
    description: 'You received a payment from a roommate',
    icon: 'CheckCircle',
  },
  DUE_REMINDER: {
    label: 'Due Reminder',
    description: 'You have a pending payment due',
    icon: 'Clock',
  },
  LOAN_REQUEST: {
    label: 'Loan Request',
    description: 'A roommate has requested a loan',
    icon: 'HandCoins',
  },
  LOAN_APPROVED: {
    label: 'Loan Approved',
    description: 'Your loan request has been approved',
    icon: 'ThumbsUp',
  },
  LOAN_REJECTED: {
    label: 'Loan Rejected',
    description: 'Your loan request has been rejected',
    icon: 'ThumbsDown',
  },
  WALLET_LOW: {
    label: 'Wallet Low',
    description: 'Your room wallet balance is running low',
    icon: 'AlertTriangle',
  },
  ROOM_INVITE: {
    label: 'Room Invite',
    description: 'You have been invited to join a room',
    icon: 'UserPlus',
  },
  MEMBER_JOINED: {
    label: 'Member Joined',
    description: 'A new member has joined your room',
    icon: 'UserCheck',
  },
  MEMBER_LEFT: {
    label: 'Member Left',
    description: 'A member has left your room',
    icon: 'UserMinus',
  },
} as const;

// ─── Routes ──────────────────────────────────────────────────────────────────

export const ROUTES = {
  // Public
  home: '/',
  login: '/login',
  signup: '/signup',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',

  // Authenticated
  dashboard: '/dashboard',
  room: {
    index: '/room',
    create: '/room/create',
    join: '/room/join',
    detail: (id: string) => `/room/${id}` as const,
    settings: (id: string) => `/room/${id}/settings` as const,
    members: (id: string) => `/room/${id}/members` as const,
  },
  expenses: {
    index: '/expenses',
    create: '/expenses/create',
    detail: (id: string) => `/expenses/${id}` as const,
  },
  wallet: {
    index: '/wallet',
    deposit: '/wallet/deposit',
    withdraw: '/wallet/withdraw',
    transactions: '/wallet/transactions',
  },
  payments: {
    index: '/payments',
    create: '/payments/create',
    detail: (id: string) => `/payments/${id}` as const,
  },
  analytics: '/analytics',
  loans: {
    index: '/loans',
    request: '/loans/request',
    detail: (id: string) => `/loans/${id}` as const,
  },
  notifications: '/notifications',
  profile: '/profile',
  settings: '/settings',
} as const;
