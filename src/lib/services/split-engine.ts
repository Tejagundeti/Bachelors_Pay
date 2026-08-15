/**
 * Split Engine — calculates how expenses are divided among roommates.
 *
 * Four strategies:
 *  1. Equal     – everyone pays the same; last person absorbs cent-rounding.
 *  2. Percentage – each person has a declared %; validates they sum to 100.
 *  3. Custom    – caller provides exact amounts; we just validate the total.
 *  4. Manual    – like custom but also validates against a known total.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SplitResult {
  userId: string;
  amount: number;
}

export interface PercentageInput {
  userId: string;
  percentage: number;
}

export interface CustomAmountInput {
  userId: string;
  amount: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Round to 2 decimal places (currency precision). */
function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Validate that a monetary amount is positive and finite. */
function assertPositiveAmount(amount: number, label = 'Amount'): void {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(`${label} must be a positive finite number, got ${amount}`);
  }
}

/** Validate that the member list is non-empty. */
function assertNonEmptyMembers(members: unknown[]): void {
  if (!members || members.length === 0) {
    throw new Error('At least one member is required for a split');
  }
}

// ─── Split Functions ─────────────────────────────────────────────────────────

/**
 * Divide `totalAmount` equally among `memberIds`.
 *
 * Because dividing currency can leave sub-cent remainders, the last person
 * in the list absorbs the difference so the parts always sum to exactly
 * `totalAmount`.
 */
export function calculateEqualSplit(
  totalAmount: number,
  memberIds: string[],
): SplitResult[] {
  assertPositiveAmount(totalAmount, 'Total amount');
  assertNonEmptyMembers(memberIds);

  // Floor to cents so nobody is overcharged
  const perPerson = Math.floor((totalAmount * 100) / memberIds.length) / 100;
  const subtotal = roundCurrency(perPerson * (memberIds.length - 1));
  const lastPersonAmount = roundCurrency(totalAmount - subtotal);

  return memberIds.map((userId, index) => ({
    userId,
    amount: index === memberIds.length - 1 ? lastPersonAmount : perPerson,
  }));
}

/**
 * Split `totalAmount` by declared percentages.
 *
 * @throws if percentages do not sum to 100 (within ±0.01 tolerance).
 */
export function calculatePercentageSplit(
  totalAmount: number,
  percentages: PercentageInput[],
): SplitResult[] {
  assertPositiveAmount(totalAmount, 'Total amount');
  assertNonEmptyMembers(percentages);

  // Validate each percentage is non-negative
  for (const p of percentages) {
    if (p.percentage < 0 || !Number.isFinite(p.percentage)) {
      throw new Error(
        `Percentage for user ${p.userId} must be a non-negative number, got ${p.percentage}`,
      );
    }
  }

  // Validate sum ≈ 100
  const totalPercentage = percentages.reduce((sum, p) => sum + p.percentage, 0);
  if (Math.abs(totalPercentage - 100) > 0.01) {
    throw new Error(
      `Percentages must sum to 100, got ${totalPercentage.toFixed(2)}`,
    );
  }

  // Calculate each share, accumulate rounding error for the last person
  const results: SplitResult[] = percentages.map((p) => ({
    userId: p.userId,
    amount: roundCurrency((totalAmount * p.percentage) / 100),
  }));

  // Adjust the last person so the total is exact
  const computedTotal = results.reduce((sum, r) => sum + r.amount, 0);
  const drift = roundCurrency(totalAmount - computedTotal);
  if (drift !== 0 && results.length > 0) {
    results[results.length - 1].amount = roundCurrency(
      results[results.length - 1].amount + drift,
    );
  }

  return results;
}

/**
 * Accept caller-provided custom amounts and validate they are consistent.
 *
 * This is an "unverified" split — we trust the caller's amounts but ensure
 * basic sanity (non-negative, at least one entry).
 */
export function calculateCustomSplit(
  customAmounts: CustomAmountInput[],
): SplitResult[] {
  assertNonEmptyMembers(customAmounts);

  for (const entry of customAmounts) {
    if (entry.amount < 0 || !Number.isFinite(entry.amount)) {
      throw new Error(
        `Amount for user ${entry.userId} must be a non-negative number, got ${entry.amount}`,
      );
    }
  }

  return customAmounts.map(({ userId, amount }) => ({
    userId,
    amount: roundCurrency(amount),
  }));
}

/**
 * Accept manually-entered amounts and verify they sum to `totalAmount`.
 *
 * @throws if the manual amounts do not sum to `totalAmount` (within ±0.01).
 */
export function calculateManualSplit(
  totalAmount: number,
  manualAmounts: CustomAmountInput[],
): SplitResult[] {
  assertPositiveAmount(totalAmount, 'Total amount');
  assertNonEmptyMembers(manualAmounts);

  for (const entry of manualAmounts) {
    if (entry.amount < 0 || !Number.isFinite(entry.amount)) {
      throw new Error(
        `Amount for user ${entry.userId} must be a non-negative number, got ${entry.amount}`,
      );
    }
  }

  const manualTotal = roundCurrency(
    manualAmounts.reduce((sum, entry) => sum + entry.amount, 0),
  );

  if (Math.abs(manualTotal - totalAmount) > 0.01) {
    throw new Error(
      `Manual amounts sum to ₹${manualTotal.toFixed(2)} but expected ₹${totalAmount.toFixed(2)}`,
    );
  }

  return manualAmounts.map(({ userId, amount }) => ({
    userId,
    amount: roundCurrency(amount),
  }));
}

// ─── Utilities ───────────────────────────────────────────────────────────────

/** Human-readable label for each split strategy. */
export const SPLIT_LABELS: Record<string, string> = {
  EQUAL: 'Split Equally',
  PERCENTAGE: 'Split by Percentage',
  CUSTOM: 'Custom Amounts',
  MANUAL: 'Manual Entry',
};

/** Verify that a set of SplitResults sums to the expected total (±0.01). */
export function validateSplitTotal(
  splits: SplitResult[],
  expectedTotal: number,
): boolean {
  const actual = roundCurrency(splits.reduce((sum, s) => sum + s.amount, 0));
  return Math.abs(actual - expectedTotal) <= 0.01;
}
