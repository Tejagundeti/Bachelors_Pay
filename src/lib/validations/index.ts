import { z } from 'zod';

// Re-export auth validations for convenience
export * from './auth';

// ─── Room Schemas ────────────────────────────────────────────────────────────

export const createRoomSchema = z.object({
  name: z
    .string()
    .min(2, 'Room name must be at least 2 characters')
    .max(50, 'Room name must be at most 50 characters')
    .trim(),
  maxMembers: z
    .number()
    .int('Max members must be a whole number')
    .min(2, 'Room must have at least 2 members')
    .max(10, 'Room can have at most 10 members'),
});

export const joinRoomSchema = z.object({
  code: z
    .string()
    .min(1, 'Room code is required')
    .max(20, 'Invalid room code')
    .trim()
    .toUpperCase(),
});

// ─── Expense Schemas ─────────────────────────────────────────────────────────

const expenseCategoryEnum = z.enum([
  'RENT',
  'ELECTRICITY',
  'WATER',
  'INTERNET',
  'GROCERIES',
  'GAS',
  'CLEANING',
  'FOOD',
  'MAINTENANCE',
  'OTHER',
]);

const splitTypeEnum = z.enum(['EQUAL', 'CUSTOM', 'PERCENTAGE', 'MANUAL']);

const customSplitSchema = z.object({
  userId: z.string().cuid('Invalid user ID'),
  amount: z.number().min(0, 'Split amount cannot be negative'),
});

export const createExpenseSchema = z.object({
  title: z
    .string()
    .min(2, 'Title must be at least 2 characters')
    .max(100, 'Title must be at most 100 characters')
    .trim(),
  amount: z
    .number()
    .positive('Amount must be greater than 0')
    .max(1_000_000, 'Amount cannot exceed ₹10,00,000'),
  category: expenseCategoryEnum,
  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .optional()
    .or(z.literal('')),
  splitType: splitTypeEnum,
  splitAmong: z
    .array(z.string().cuid('Invalid user ID'))
    .min(1, 'At least one member must be selected for the split'),
  customSplits: z.array(customSplitSchema).optional(),
  dueDate: z.coerce.date().optional(),
});

// ─── Wallet Schemas ──────────────────────────────────────────────────────────

export const walletDepositSchema = z.object({
  amount: z
    .number()
    .positive('Deposit amount must be greater than 0')
    .max(100_000, 'Deposit cannot exceed ₹1,00,000'),
});

export const walletWithdrawSchema = z.object({
  amount: z
    .number()
    .positive('Withdrawal amount must be greater than 0')
    .max(100_000, 'Withdrawal cannot exceed ₹1,00,000'),
});

// ─── Payment Schemas ─────────────────────────────────────────────────────────

const paymentMethodEnum = z.enum([
  'UPI',
  'QR',
  'BANK_TRANSFER',
  'CASH',
  'WALLET',
  'RAZORPAY',
]);

export const createPaymentSchema = z.object({
  amount: z
    .number()
    .positive('Payment amount must be greater than 0')
    .max(1_000_000, 'Payment cannot exceed ₹10,00,000'),
  receiverId: z.string().cuid('Invalid receiver ID'),
  method: paymentMethodEnum,
  expenseId: z.string().cuid('Invalid expense ID').optional(),
  notes: z
    .string()
    .max(250, 'Notes must be at most 250 characters')
    .optional()
    .or(z.literal('')),
});

// ─── Loan Schemas ────────────────────────────────────────────────────────────

export const requestLoanSchema = z.object({
  amount: z
    .number()
    .positive('Loan amount must be greater than 0')
    .max(500_000, 'Loan cannot exceed ₹5,00,000'),
  reason: z
    .string()
    .min(5, 'Reason must be at least 5 characters')
    .max(500, 'Reason must be at most 500 characters')
    .trim(),
  repaymentDate: z.coerce
    .date()
    .refine(
      (date) => date > new Date(),
      'Repayment date must be in the future'
    ),
});

// ─── Profile Schemas ─────────────────────────────────────────────────────────

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be at most 50 characters')
    .trim(),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian phone number')
    .optional()
    .or(z.literal('')),
});

// ─── Inferred Types ──────────────────────────────────────────────────────────

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type JoinRoomInput = z.infer<typeof joinRoomSchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type WalletDepositInput = z.infer<typeof walletDepositSchema>;
export type WalletWithdrawInput = z.infer<typeof walletWithdrawSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type RequestLoanInput = z.infer<typeof requestLoanSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
