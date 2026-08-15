import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

const createRecurringSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  amount: z.number().positive('Amount must be positive'),
  category: z.enum([
    'RENT', 'ELECTRICITY', 'WATER', 'INTERNET', 'GROCERIES',
    'GAS', 'CLEANING', 'FOOD', 'MAINTENANCE', 'OTHER',
  ]),
  dayOfMonth: z.number().int().min(1).max(31).default(1),
});

// GET: Fetch recurring expenses for current user's room
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find user's room membership
    const membership = await prisma.roomMember.findFirst({
      where: { userId: session.user.id },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'You are not a member of any room' },
        { status: 400 }
      );
    }

    const recurring = await prisma.recurringExpense.findMany({
      where: { roomId: membership.roomId },
      orderBy: { dayOfMonth: 'asc' },
    });

    return NextResponse.json({ recurring });
  } catch (error) {
    console.error('Get recurring expenses error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create a recurring expense
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find user's room membership
    const membership = await prisma.roomMember.findFirst({
      where: { userId: session.user.id },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'You are not a member of any room' },
        { status: 400 }
      );
    }

    // Verify user role (Owner or Admin only)
    if (membership.role !== 'OWNER' && membership.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only room owners and admins can configure recurring expenses' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validation = createRecurringSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { title, amount, category, dayOfMonth } = validation.data;

    const recurring = await prisma.recurringExpense.create({
      data: {
        title,
        amount,
        category,
        dayOfMonth,
        roomId: membership.roomId,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'RECURRING_EXPENSE_CREATE',
        details: { recurringId: recurring.id, title, amount },
        userId: session.user.id,
        roomId: membership.roomId,
      },
    });

    return NextResponse.json({ recurring }, { status: 201 });
  } catch (error) {
    console.error('Create recurring expense error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
