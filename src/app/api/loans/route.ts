import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { isEligibleForLoan, maxLoanAmount } from '@/lib/services/credit-score';

const requestLoanSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  reason: z.string().min(1, 'Reason is required').max(200),
  lenderId: z.string().min(1, 'Lender ID is required'),
  roomId: z.string().min(1, 'Room ID is required'),
  dueDate: z.string().datetime('Invalid due date format'),
});

// GET: Retrieve loans involving the user
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));
    const status = searchParams.get('status');
    const role = searchParams.get('role') || 'all'; // 'borrower', 'lender', 'all'
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    // Filter by role
    if (role === 'borrower') {
      where.borrowerId = session.user.id;
    } else if (role === 'lender') {
      where.lenderId = session.user.id;
    } else {
      where.OR = [
        { borrowerId: session.user.id },
        { lenderId: session.user.id },
      ];
    }

    // Filter by status
    if (status) {
      where.status = status;
    }

    const [dbLoans, total] = await Promise.all([
      prisma.loan.findMany({
        where,
        include: {
          borrower: {
            select: { id: true, name: true, image: true, creditScore: true },
          },
          lender: {
            select: { id: true, name: true, image: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.loan.count({ where }),
    ]);

    // Map repaymentDate in database to dueDate expected by UI hook
    const loans = dbLoans.map((l) => ({
      ...l,
      dueDate: l.repaymentDate.toISOString(),
      borrower: {
        id: l.borrower.id,
        name: l.borrower.name || 'Roommate',
        avatar: l.borrower.image,
        creditScore: l.borrower.creditScore,
      },
      lender: l.lender ? {
        id: l.lender.id,
        name: l.lender.name || 'Roommate',
        avatar: l.lender.image,
      } : null,
    }));

    return NextResponse.json({
      loans,
      total,
    });
  } catch (error) {
    console.error('Get loans error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Request a new loan
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validation = requestLoanSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { amount, reason, lenderId, roomId, dueDate } = validation.data;

    // Check borrower credit score eligibility
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { creditScore: true, name: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!isEligibleForLoan(user.creditScore)) {
      return NextResponse.json(
        { error: `Insufficient credit score (${user.creditScore}). Minimum score required is 600.` },
        { status: 403 }
      );
    }

    const maxAllowed = maxLoanAmount(user.creditScore);
    if (amount > maxAllowed) {
      return NextResponse.json(
        { error: `Requested amount exceeds your current credit limit of ₹${maxAllowed.toLocaleString('en-IN')}` },
        { status: 403 }
      );
    }

    // Verify lender exists and is a roommate
    const roomMembership = await prisma.roomMember.findUnique({
      where: {
        userId_roomId: {
          userId: lenderId,
          roomId,
        },
      },
    });

    if (!roomMembership) {
      return NextResponse.json(
        { error: 'Lender must be a member of the same room' },
        { status: 400 }
      );
    }

    // Create loan request in transaction + send notification
    const loan = await prisma.$transaction(async (tx) => {
      const newLoan = await tx.loan.create({
        data: {
          amount,
          reason,
          borrowerId: session.user!.id!,
          lenderId,
          repaymentDate: new Date(dueDate),
          status: 'PENDING',
        },
        include: {
          borrower: { select: { id: true, name: true, image: true, creditScore: true } },
          lender: { select: { id: true, name: true, image: true } },
        },
      });

      await tx.notification.create({
        data: {
          userId: lenderId,
          type: 'LOAN_REQUEST',
          title: 'Loan Request',
          message: `${user.name || 'Someone'} requested a loan of ₹${amount.toFixed(2)}: "${reason}"`,
          data: {
            loanId: newLoan.id,
            amount,
          },
        },
      });

      return newLoan;
    });

    const formattedLoan = {
      ...loan,
      dueDate: loan.repaymentDate.toISOString(),
      borrower: {
        id: loan.borrower.id,
        name: loan.borrower.name || 'Roommate',
        avatar: loan.borrower.image,
        creditScore: loan.borrower.creditScore,
      },
      lender: loan.lender ? {
        id: loan.lender.id,
        name: loan.lender.name || 'Roommate',
        avatar: loan.lender.image,
      } : null,
    };

    return NextResponse.json(formattedLoan, { status: 201 });
  } catch (error) {
    console.error('Request loan error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
