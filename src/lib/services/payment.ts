/**
 * Payment Service
 *
 * Handles UPI link generation, QR code creation, and payment record
 * management.  Razorpay integration is stubbed with TODO placeholders.
 */

import QRCode from 'qrcode';
import prisma from '../prisma';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

// ─── UPI ─────────────────────────────────────────────────────────────────────

export interface UPILinkParams {
  /** Payee's UPI Virtual Payment Address, e.g. "user@upi" */
  payeeVPA: string;
  /** Display name of the payee */
  payeeName: string;
  /** Amount in INR */
  amount: number;
  /** Optional note shown to both parties */
  transactionNote?: string;
  /** Optional transaction reference ID */
  transactionRefId?: string;
}

/**
 * Build a UPI deep-link URL.
 *
 * These links open the user's UPI app (GPay, PhonePe, Paytm, etc.) with
 * the payment pre-filled.
 *
 * Spec: https://www.npci.org.in/what-we-do/upi/upi-qr-code
 */
export function generateUPILink({
  payeeVPA,
  payeeName,
  amount,
  transactionNote,
  transactionRefId,
}: UPILinkParams): string {
  if (!payeeVPA) throw new Error('payeeVPA is required');
  if (amount <= 0) throw new Error('amount must be positive');

  const params = new URLSearchParams({
    pa: payeeVPA,
    pn: payeeName,
    am: amount.toFixed(2),
    cu: 'INR',
  });

  if (transactionNote) params.set('tn', transactionNote);
  if (transactionRefId) params.set('tr', transactionRefId);

  return `upi://pay?${params.toString()}`;
}

// ─── QR Code ─────────────────────────────────────────────────────────────────

/**
 * Generate a data-URL PNG of a QR code encoding `data`.
 *
 * Returns a base-64 data URL suitable for `<img src="...">`.
 */
export async function generateQRDataURL(data: string): Promise<string> {
  return QRCode.toDataURL(data, {
    width: 300,
    margin: 2,
    color: {
      dark: '#0F172A',  // slate-900
      light: '#FFFFFF',
    },
  });
}

/**
 * Convenience: generate a UPI QR in one call.
 */
export async function generateUPIQR(params: UPILinkParams): Promise<string> {
  const link = generateUPILink(params);
  return generateQRDataURL(link);
}

// ─── Payment Records (Database) ──────────────────────────────────────────────

export interface CreatePaymentInput {
  expenseId?: string;
  senderId: string;
  receiverId: string;
  amount: number;
  method: PaymentMethod;
  transactionId?: string;
  notes?: string;
}

/**
 * Persist a payment record in the database.
 */
export async function createPaymentRecord(data: CreatePaymentInput) {
  return prisma.payment.create({
    data: {
      senderId: data.senderId,
      receiverId: data.receiverId,
      amount: data.amount,
      method: data.method,
      transactionId: data.transactionId ?? null,
      notes: data.notes ?? null,
      status: 'SUCCESS' as PaymentStatus,
      expenseId: data.expenseId ?? null,
    },
  });
}

/**
 * Fetch payment history for a user (sent or received).
 */
export async function getPaymentHistory(
  userId: string,
  opts: { take?: number; skip?: number } = {},
) {
  const { take = 20, skip = 0 } = opts;

  return prisma.payment.findMany({
    where: {
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
    include: {
      sender: { select: { id: true, name: true, image: true } },
      receiver: { select: { id: true, name: true, image: true } },
    },
    orderBy: { createdAt: 'desc' },
    take,
    skip,
  });
}

// ─── Razorpay Integration (Placeholder) ──────────────────────────────────────
//
// These functions are stubbed out for future integration.  When Razorpay
// credentials are configured, replace the placeholders with real SDK calls.
//
// Required env vars:
//   RAZORPAY_KEY_ID
//   RAZORPAY_KEY_SECRET

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
}

/**
 * Create a Razorpay order.
 *
 * TODO: Replace with actual Razorpay SDK call:
 * ```ts
 * import Razorpay from 'razorpay';
 * const razorpay = new Razorpay({
 *   key_id: process.env.RAZORPAY_KEY_ID!,
 *   key_secret: process.env.RAZORPAY_KEY_SECRET!,
 * });
 * return razorpay.orders.create({
 *   amount: amount * 100, // Razorpay expects paise
 *   currency,
 *   receipt: `receipt_${Date.now()}`,
 * });
 * ```
 */
export async function createRazorpayOrder(
  amount: number,
  currency: string = 'INR',
): Promise<RazorpayOrder> {
  console.warn('[Razorpay] Using placeholder order creation');
  return {
    id: `order_placeholder_${Date.now()}`,
    amount: amount * 100,
    currency,
  };
}

/**
 * Verify a Razorpay payment signature.
 *
 * TODO: Replace with actual HMAC verification:
 * ```ts
 * import crypto from 'crypto';
 * const body = orderId + '|' + paymentId;
 * const expected = crypto
 *   .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
 *   .update(body)
 *   .digest('hex');
 * return expected === signature;
 * ```
 */
export async function verifyRazorpayPayment(
  orderId: string,
  paymentId: string,
  signature: string,
): Promise<boolean> {
  console.warn('[Razorpay] Using placeholder payment verification');
  console.log('Payment verification placeholder:', {
    orderId,
    paymentId,
    signature,
  });
  return true;
}

/**
 * Fetch Razorpay payment details.
 *
 * TODO: Replace with:
 * ```ts
 * return razorpay.payments.fetch(paymentId);
 * ```
 */
export async function fetchRazorpayPayment(paymentId: string) {
  console.warn('[Razorpay] Using placeholder payment fetch');
  return {
    id: paymentId,
    status: 'captured',
    amount: 0,
    currency: 'INR',
  };
}
