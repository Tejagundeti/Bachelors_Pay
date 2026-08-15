import prisma from '@/lib/prisma';
import { ExpenseCategory } from '@prisma/client';

/**
 * Checks and automatically generates expenses for active recurring bills
 * that are due for the current month and haven't been created yet.
 */
export async function checkAndGenerateRecurringBills(roomId: string) {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed
    const currentDay = now.getDate();

    // Start & end of the current calendar month
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);

    // Get all active recurring expenses for the room
    const recurringBills = await prisma.recurringExpense.findMany({
      where: {
        roomId,
        isActive: true,
      },
    });

    if (recurringBills.length === 0) return;

    // Get the room owner's ID to set as default payer
    const ownerMember = await prisma.roomMember.findFirst({
      where: { roomId, role: 'OWNER' },
    });

    const payerId = ownerMember ? ownerMember.userId : null;
    if (!payerId) return; // Need a payer to associate the expense

    // Get all members of the room to calculate splits
    const roomMembers = await prisma.roomMember.findMany({
      where: { roomId },
    });

    if (roomMembers.length === 0) return;

    for (const bill of recurringBills) {
      // 1. Check if the bill's due day has arrived for this month
      if (currentDay < bill.dayOfMonth) {
        continue; // Not due yet
      }

      // 2. Check if a matching expense has already been generated this month
      // We look for an expense in the same room with the same title, amount, and category created this month
      const existingExpense = await prisma.expense.findFirst({
        where: {
          roomId,
          title: bill.title,
          amount: bill.amount,
          category: bill.category,
          date: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      });

      if (existingExpense) {
        continue; // Already generated for this month
      }

      // 3. Generate the expense and equal splits
      const splitAmount = Math.floor((bill.amount / roomMembers.length) * 100) / 100;
      const remainder = Math.round((bill.amount - splitAmount * roomMembers.length) * 100) / 100;

      await prisma.$transaction(async (tx) => {
        const newExpense = await tx.expense.create({
          data: {
            title: bill.title,
            amount: bill.amount,
            category: bill.category,
            description: `Auto-generated recurring bill for day ${bill.dayOfMonth} of the month.`,
            splitType: 'EQUAL',
            date: new Date(),
            dueDate: new Date(currentYear, currentMonth, bill.dayOfMonth, 23, 59, 59),
            paidById: payerId,
            roomId,
          },
        });

        // Create splits
        await tx.expenseSplit.createMany({
          data: roomMembers.map((member, index) => ({
            expenseId: newExpense.id,
            userId: member.userId,
            // Last member gets the remainder of decimal division
            amount: index === roomMembers.length - 1 ? splitAmount + remainder : splitAmount,
            // Owner/payer split is marked as settled immediately
            isPaid: member.userId === payerId,
            paidAt: member.userId === payerId ? new Date() : null,
          })),
        });

        // Create notifications for other roommates
        const notificationData = roomMembers
          .filter((member) => member.userId !== payerId)
          .map((member) => ({
            userId: member.userId,
            type: 'EXPENSE_ADDED' as const,
            title: 'Recurring Bill Generated',
            message: `Recurring bill "${bill.title}" generated for this month. Your share is ₹${splitAmount.toFixed(2)}`,
            data: { roomId, expenseId: newExpense.id },
          }));

        if (notificationData.length > 0) {
          await tx.notification.createMany({
            data: notificationData,
          });
        }

        // Add audit log
        await tx.auditLog.create({
          data: {
            action: 'RECURRING_EXPENSE_TRIGGERED',
            details: { recurringId: bill.id, expenseId: newExpense.id, title: bill.title },
            userId: payerId,
            roomId,
          },
        });
      });

      console.log(`[Recurring Bill] Generated expense "${bill.title}" for Room ${roomId}`);
    }
  } catch (error) {
    console.error('Error auto-generating recurring bills:', error);
  }
}
