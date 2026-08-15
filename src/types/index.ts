import type {
  User,
  Room,
  RoomMember,
  Expense,
  ExpenseSplit,
  Wallet,
  WalletTransaction,
  Payment,
  Notification,
  Loan,
  LoanRepayment,
  CreditHistory,
  InviteCode,
  RecurringExpense,
  AuditLog,
} from '@prisma/client';

// ─── Generic API Wrappers ────────────────────────────────────────────────────

/** Standard API response envelope */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/** Paginated list response */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

// ─── User ────────────────────────────────────────────────────────────────────

/** Safe user type without password */
export type SafeUser = Omit<User, 'password'>;

export interface UserWithCreditHistory extends SafeUser {
  creditHistory: CreditHistory[];
}

// ─── Room ────────────────────────────────────────────────────────────────────

export interface RoomMemberWithUser extends RoomMember {
  user: SafeUser;
}

export interface RoomWithMembers extends Room {
  members: RoomMemberWithUser[];
  wallet: Wallet | null;
  _count?: {
    members: number;
    expenses: number;
  };
}

export interface RoomWithDetails extends RoomWithMembers {
  expenses: ExpenseWithSplits[];
  recurring: RecurringExpense[];
  inviteCodes: InviteCode[];
}

// ─── Expense ─────────────────────────────────────────────────────────────────

export interface ExpenseSplitWithUser extends ExpenseSplit {
  user: SafeUser;
}

export interface ExpenseWithSplits extends Expense {
  paidBy: SafeUser;
  room: Room;
  splits: ExpenseSplitWithUser[];
  payments: Payment[];
}

// ─── Wallet ──────────────────────────────────────────────────────────────────

export interface WalletTransactionWithUser extends WalletTransaction {
  user: SafeUser;
}

export interface WalletWithTransactions extends Wallet {
  room: Room;
  transactions: WalletTransactionWithUser[];
}

// ─── Payment ─────────────────────────────────────────────────────────────────

export interface PaymentWithUsers extends Payment {
  sender: SafeUser;
  receiver: SafeUser;
  expense: Expense | null;
}

// ─── Notification ────────────────────────────────────────────────────────────

export interface NotificationWithUser extends Notification {
  user: SafeUser;
}

// ─── Loan ────────────────────────────────────────────────────────────────────

export interface LoanRepaymentWithUser extends LoanRepayment {
  user: SafeUser;
}

export interface LoanWithUsers extends Loan {
  borrower: SafeUser;
  lender: SafeUser | null;
  repayments: LoanRepaymentWithUser[];
}

// ─── Audit ───────────────────────────────────────────────────────────────────

export interface AuditLogWithRelations extends AuditLog {
  user: SafeUser | null;
  room: Room | null;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export interface DashboardStats {
  /** Total amount owed to you */
  totalOwed: number;
  /** Total amount you owe */
  totalOwing: number;
  /** Net balance (owed - owing) */
  netBalance: number;
  /** Room wallet balance */
  walletBalance: number;
  /** Your current credit score */
  creditScore: number;
  /** Number of pending payments */
  pendingPayments: number;
  /** Number of active loans */
  activeLoans: number;
  /** Number of unread notifications */
  unreadNotifications: number;
  /** Total number of room members */
  totalMembers: number;
}

export interface DashboardRecentActivity {
  recentExpenses: ExpenseWithSplits[];
  recentPayments: PaymentWithUsers[];
  upcomingDues: ExpenseSplitWithUser[];
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export interface CategoryBreakdown {
  category: string;
  label: string;
  amount: number;
  percentage: number;
  count: number;
  color: string;
}

export interface MonthlyTrend {
  month: string;
  year: number;
  total: number;
  categories: Record<string, number>;
}

export interface MemberContribution {
  userId: string;
  userName: string;
  userImage: string | null;
  totalPaid: number;
  totalOwed: number;
  netContribution: number;
}

export interface AnalyticsData {
  categoryBreakdown: CategoryBreakdown[];
  monthlyTrends: MonthlyTrend[];
  memberContributions: MemberContribution[];
  totalExpenses: number;
  averageExpense: number;
  highestExpense: ExpenseWithSplits | null;
  expenseCount: number;
}

// ─── Misc ────────────────────────────────────────────────────────────────────

/** Used for select dropdowns of room members */
export interface MemberOption {
  value: string;
  label: string;
  image: string | null;
}

/** Balance summary between two users */
export interface BalanceSummary {
  userId: string;
  userName: string;
  userImage: string | null;
  owes: number;
  isOwed: number;
  net: number;
}
