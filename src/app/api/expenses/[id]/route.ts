import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

const updateExpenseSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  amount: z.number().positive().optional(),
  category: z.enum([
    'RENT', 'ELECTRICITY', 'WATER', 'INTERNET', 'GROCERIES',
    'GAS', 'CLEANING', 'FOOD', 'MAINTENANCE', 'OTHER',
  ]).optional(),
  description: z.string().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  proofImage: z.string().url().nullable().optional(),
});

// GET: Single expense with splits and payment info
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const expense = await prisma.expense.findUnique({
      where: { id },
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
        payments: {
          include: {
            sender: {
              select: { id: true, name: true, image: true },
            },
            receiver: {
              select: { id: true, name: true, image: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        room: {
          select: { id: true, name: true },
        },
      },
    });

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    // Verify user belongs to the room
    const membership = await prisma.roomMember.findUnique({
      where: {
        userId_roomId: {
          userId: session.user.id,
          roomId: expense.roomId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'You do not have access to this expense' },
        { status: 403 }
      );
    }

    return NextResponse.json({ expense });
  } catch (error) {
    console.error('Get expense error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Update expense (only by creator)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const expense = await prisma.expense.findUnique({
      where: { id },
    });

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    // Only the creator (paidBy) can update
    if (expense.paidById !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the expense creator can update this expense' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validation = updateExpenseSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    const data = validation.data;

    if (data.title !== undefined) updateData.title = data.title;
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    if (data.proofImage !== undefined) updateData.proofImage = data.proofImage;

    const updatedExpense = await prisma.expense.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({ expense: updatedExpense });
  } catch (error) {
    console.error('Update expense error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Delete expense and its splits (only by creator)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const expense = await prisma.expense.findUnique({
      where: { id },
    });

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    // Only the creator (paidBy) can delete
    if (expense.paidById !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the expense creator can delete this expense' },
        { status: 403 }
      );
    }

    // Delete expense (cascades to splits via schema)
    await prisma.expense.delete({ where: { id } });

    return NextResponse.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Delete expense error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
