/**
 * Credit Score Service
 *
 * Each user has an internal credit score (300–900) that tracks payment
 * reliability.  Scores influence loan eligibility within the household.
 *
 * Score changes are recorded in `CreditHistory` for full auditability.
 */

import prisma from '../prisma';

// ─── Constants ───────────────────────────────────────────────────────────────

export const MIN_SCORE = 300;
export const MAX_SCORE = 900;
export const DEFAULT_SCORE = 700;

/** Points awarded for paying on time. */
export const ON_TIME_BONUS = 5;

/** Points deducted for a late payment (paid within grace period). */
export const LATE_PENALTY = -10;

/** Points deducted when a payment goes overdue (past grace period). */
export const OVERDUE_PENALTY = -20;

/** Minimum credit score required to request a loan. */
export const MIN_LOAN_SCORE = 600;

// ─── Score Tiers (for UI badges) ─────────────────────────────────────────────

export type ScoreTier = 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Very Poor';

export function getScoreTier(score: number): ScoreTier {
  if (score >= 800) return 'Excellent';
  if (score >= 700) return 'Good';
  if (score >= 600) return 'Fair';
  if (score >= 450) return 'Poor';
  return 'Very Poor';
}

export function getScoreColor(tier: ScoreTier): string {
  const colors: Record<ScoreTier, string> = {
    Excellent: '#22C55E', // green-500
    Good: '#3B82F6',      // blue-500
    Fair: '#F59E0B',      // amber-500
    Poor: '#F97316',      // orange-500
    'Very Poor': '#EF4444', // red-500
  };
  return colors[tier];
}

// ─── Core Functions ──────────────────────────────────────────────────────────

/**
 * Apply a credit-score change inside a transaction.
 *
 * The new score is clamped to [MIN_SCORE, MAX_SCORE] and an audit row is
 * written to `CreditHistory`.
 *
 * @returns the updated score.
 */
export async function updateCreditScore(
  userId: string,
  change: number,
  reason: string,
): Promise<number> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error(`User not found: ${userId}`);

  const scoreBefore = user.creditScore;
  const newScore = Math.min(MAX_SCORE, Math.max(MIN_SCORE, scoreBefore + change));

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { creditScore: newScore },
    }),
    prisma.creditHistory.create({
      data: {
        userId,
        scoreBefore,
        scoreAfter: newScore,
        reason,
      },
    }),
  ]);

  return newScore;
}

/**
 * Reward a user for paying on time.
 */
export async function onTimePayment(userId: string): Promise<number> {
  return updateCreditScore(userId, ON_TIME_BONUS, 'On-time payment');
}

/**
 * Penalize a user for a late (but eventually completed) payment.
 */
export async function latePayment(userId: string): Promise<number> {
  return updateCreditScore(userId, LATE_PENALTY, 'Late payment');
}

/**
 * Penalize a user for a payment that went fully overdue.
 */
export async function overduePayment(userId: string): Promise<number> {
  return updateCreditScore(userId, OVERDUE_PENALTY, 'Overdue payment');
}

// ─── Loan Eligibility ────────────────────────────────────────────────────────

/**
 * Whether the given score qualifies for requesting a loan.
 */
export function isEligibleForLoan(creditScore: number): boolean {
  return creditScore >= MIN_LOAN_SCORE;
}

/**
 * Calculate a suggested maximum loan amount based on the credit score.
 *
 * Higher scores unlock higher ceilings (linear scale from ₹0 at 300 to
 * ₹50,000 at 900).
 */
export function maxLoanAmount(creditScore: number): number {
  if (!isEligibleForLoan(creditScore)) return 0;
  const fraction = (creditScore - MIN_SCORE) / (MAX_SCORE - MIN_SCORE);
  return Math.round(fraction * 50_000);
}

// ─── History ─────────────────────────────────────────────────────────────────

/**
 * Retrieve paginated credit-score history for a user.
 */
export async function getCreditHistory(
  userId: string,
  opts: { take?: number; skip?: number } = {},
) {
  const { take = 20, skip = 0 } = opts;
  return prisma.creditHistory.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take,
    skip,
  });
}
