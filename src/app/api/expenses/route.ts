import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

const createExpenseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  amount: z.number().positive('Amount must be positive'),
  category: z.enum([
    'RENT', 'ELECTRICITY', 'WATER', 'INTERNET', 'GROCERIES',
    'GAS', 'CLEANING', 'FOOD', 'MAINTENANCE', 'OTHER',
  ]),
  description: z.string().optional(),
  splitType: z.enum(['EQUAL', 'CUSTOM', 'PERCENTAGE', 'MANUAL']).default('EQUAL'),
  dueDate: z.string().datetime().optional(),
  proofImage: z.string().url().optional(),
  // For CUSTOM / MANUAL splits: array of { userId, amount }
  // For PERCENTAGE splits: array of { userId, percentage }
  splits: z
    .array(
      z.object({
        userId: z.string(),
        amount: z.number().optional(),
        percentage: z.number().optional(),
      })
    )
    .optional(),
  // Optional: specify which members to include (defaults to all room members)
  memberIds: z.array(z.string()).optional(),
});

// GET: List expenses with pagination, search, category filter, and date range
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find user's room
    const membership = await prisma.roomMember.findFirst({
      where: { userId: session.user.id },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'You are not a member of any room' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));
    const search = searchParams.get('q') || searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause
    const where: Record<string, unknown> = {
      roomId: membership.roomId,
    };

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        (where.date as Record<string, Date>).gte = new Date(startDate);
      }
      if (endDate) {
        (where.date as Record<string, Date>).lte = new Date(endDate);
      }
    }

    const skip = (page - 1) * limit;

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: {
          paidBy: {
            select: { id: true, name: true, email: true, image: true },
          },
          splits: {
            include: {
              user: {
                select: { id: true, name: true, email: true, image: true },
              },
            },
          },
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.expense.count({ where }),
    ]);

    return NextResponse.json({
      expenses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create expense with split calculation
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find user's room
    const membership = await prisma.roomMember.findFirst({
      where: { userId: session.user.id },
      include: {
        room: {
          include: {
            members: {
              include: {
                user: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'You are not a member of any room' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const validation = createExpenseSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const {
      title, amount, category, description, splitType,
      dueDate, proofImage, splits: customSplits, memberIds,
    } = validation.data;

    // Determine members involved in the split
    const allMembers = membership.room.members;
    const targetMembers = memberIds
      ? allMembers.filter((m) => memberIds.includes(m.userId))
      : allMembers;

    if (targetMembers.length === 0) {
      return NextResponse.json(
        { error: 'No members to split the expense with' },
        { status: 400 }
      );
    }

    // Calculate splits based on split type
    let splitAmounts: { userId: string; amount: number }[] = [];

    switch (splitType) {
      case 'EQUAL': {
        const baseAmount = Math.floor((amount / targetMembers.length) * 100) / 100;
        const remainder = Math.round((amount - baseAmount * targetMembers.length) * 100) / 100;

        splitAmounts = targetMembers.map((member, index) => ({
          userId: member.userId,
          // Last person gets the remainder to handle rounding
          amount: index === targetMembers.length - 1
            ? baseAmount + remainder
            : baseAmount,
        }));
        break;
      }

      case 'CUSTOM':
      case 'MANUAL': {
        if (!customSplits || customSplits.length === 0) {
          return NextResponse.json(
            { error: 'Splits are required for CUSTOM/MANUAL split type' },
            { status: 400 }
          );
        }

        // Validate that split amounts add up to total
        const totalSplit = customSplits.reduce((sum, s) => sum + (s.amount || 0), 0);
        if (Math.abs(totalSplit - amount) > 0.01) {
          return NextResponse.json(
            { error: `Split amounts (${totalSplit}) do not match expense amount (${amount})` },
            { status: 400 }
          );
        }

        splitAmounts = customSplits.map((s) => ({
          userId: s.userId,
          amount: s.amount || 0,
        }));
        break;
      }

      case 'PERCENTAGE': {
        if (!customSplits || customSplits.length === 0) {
          return NextResponse.json(
            { error: 'Splits with percentages are required for PERCENTAGE split type' },
            { status: 400 }
          );
        }

        // Validate percentages add up to 100
        const totalPercentage = customSplits.reduce((sum, s) => sum + (s.percentage || 0), 0);
        if (Math.abs(totalPercentage - 100) > 0.01) {
          return NextResponse.json(
            { error: `Percentages (${totalPercentage}%) do not add up to 100%` },
            { status: 400 }
          );
        }

        splitAmounts = customSplits.map((s) => ({
          userId: s.userId,
          amount: Math.round((amount * (s.percentage || 0)) / 100 * 100) / 100,
        }));

        // Adjust rounding on last entry
        const currentTotal = splitAmounts.reduce((sum, s) => sum + s.amount, 0);
        const diff = Math.round((amount - currentTotal) * 100) / 100;
        if (Math.abs(diff) > 0 && splitAmounts.length > 0) {
          splitAmounts[splitAmounts.length - 1].amount += diff;
        }
        break;
      }
    }

    // Create expense with splits in a transaction
    const expense = await prisma.$transaction(async (tx) => {
      const newExpense = await tx.expense.create({
        data: {
          title,
          amount,
          category,
          description,
          splitType,
          proofImage,
          date: new Date(),
          dueDate: dueDate ? new Date(dueDate) : null,
          paidById: session.user!.id!,
          roomId: membership.roomId,
        },
      });

      // Create expense splits
      await tx.expenseSplit.createMany({
        data: splitAmounts.map((split) => ({
          expenseId: newExpense.id,
          userId: split.userId,
          amount: split.amount,
          // The payer's own split is already "paid"
          isPaid: split.userId === session.user!.id,
          paidAt: split.userId === session.user!.id ? new Date() : null,
        })),
      });

      // Create notifications for each member (except the payer)
      const notificationsData = splitAmounts
        .filter((s) => s.userId !== session.user!.id)
        .map((split) => ({
          userId: split.userId,
          type: 'EXPENSE_ADDED' as const,
          title: 'New Expense',
          message: `${session.user!.name || 'Someone'} added "${title}" - you owe ₹${split.amount.toFixed(2)}`,
          data: {
            expenseId: newExpense.id,
            amount: split.amount,
          },
        }));

      if (notificationsData.length > 0) {
        await tx.notification.createMany({ data: notificationsData });
      }

      return tx.expense.findUnique({
        where: { id: newExpense.id },
        include: {
          paidBy: {
            select: { id: true, name: true, email: true, image: true },
          },
          splits: {
            include: {
              user: {
                select: { id: true, name: true, email: true, image: true },
              },
            },
          },
        },
      });
    });

    return NextResponse.json(
      { message: 'Expense created successfully', expense },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create expense error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
