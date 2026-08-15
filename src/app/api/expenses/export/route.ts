import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET: Export expenses as CSV
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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause
    const where: Record<string, unknown> = {
      roomId: membership.roomId,
    };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        (where.date as Record<string, Date>).gte = new Date(startDate);
      }
      if (endDate) {
        (where.date as Record<string, Date>).lte = new Date(endDate);
      }
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        paidBy: {
          select: { name: true, email: true },
        },
        splits: {
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    // Build CSV content
    const csvHeaders = [
      'Date',
      'Title',
      'Category',
      'Amount',
      'Paid By',
      'Split Type',
      'Description',
      'Due Date',
      'Is Paid',
      'Split Details',
    ];

    const csvRows = expenses.map((expense) => {
      const splitDetails = expense.splits
        .map((s) => `${s.user.name || s.user.email}: ₹${s.amount.toFixed(2)} (${s.isPaid ? 'Paid' : 'Unpaid'})`)
        .join('; ');

      return [
        new Date(expense.date).toISOString().split('T')[0],
        `"${expense.title.replace(/"/g, '""')}"`,
        expense.category,
        expense.amount.toFixed(2),
        expense.paidBy.name || expense.paidBy.email,
        expense.splitType,
        `"${(expense.description || '').replace(/"/g, '""')}"`,
        expense.dueDate ? new Date(expense.dueDate).toISOString().split('T')[0] : '',
        expense.isPaid ? 'Yes' : 'No',
        `"${splitDetails.replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csv = [csvHeaders.join(','), ...csvRows].join('\n');

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="expenses_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export expenses error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
