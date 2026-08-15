import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

const updateRecurringSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  amount: z.number().positive().optional(),
  category: z.enum([
    'RENT', 'ELECTRICITY', 'WATER', 'INTERNET', 'GROCERIES',
    'GAS', 'CLEANING', 'FOOD', 'MAINTENANCE', 'OTHER',
  ]).optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  isActive: z.boolean().optional(),
});

// Helper to check user permission for a recurring expense
async function checkPermission(userId: string, recurringId: string) {
  const recurring = await prisma.recurringExpense.findUnique({
    where: { id: recurringId },
  });

  if (!recurring) {
    return { error: 'Recurring expense not found', status: 404 };
  }

  // Find membership
  const membership = await prisma.roomMember.findFirst({
    where: { userId, roomId: recurring.roomId },
  });

  if (!membership) {
    return { error: 'Unauthorized room access', status: 403 };
  }

  if (membership.role !== 'OWNER' && membership.role !== 'ADMIN') {
    return { error: 'Only owners and admins can edit recurring expenses', status: 403 };
  }

  return { recurring, membership };
}

// PUT: Update a recurring expense
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
    const authCheck = await checkPermission(session.user.id, id);
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { recurring, membership } = authCheck;
    const body = await req.json();
    const validation = updateRecurringSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updated = await prisma.recurringExpense.update({
      where: { id },
      data: validation.data,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'RECURRING_EXPENSE_UPDATE',
        details: { recurringId: id, updates: validation.data },
        userId: session.user.id,
        roomId: recurring.roomId,
      },
    });

    return NextResponse.json({ recurring: updated });
  } catch (error) {
    console.error('Update recurring expense error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a recurring expense
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
    const authCheck = await checkPermission(session.user.id, id);
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { recurring } = authCheck;

    await prisma.recurringExpense.delete({
      where: { id },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'RECURRING_EXPENSE_DELETE',
        details: { recurringId: id, title: recurring.title },
        userId: session.user.id,
        roomId: recurring.roomId,
      },
    });

    return NextResponse.json({ message: 'Recurring expense deleted successfully' });
  } catch (error) {
    console.error('Delete recurring expense error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
