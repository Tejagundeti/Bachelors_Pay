import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: loanId } = await params;

    // Verify loan request exists and user is the lender
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        borrower: { select: { id: true, name: true } },
        lender: { select: { id: true, name: true } },
      },
    });

    if (!loan) {
      return NextResponse.json({ error: 'Loan request not found' }, { status: 404 });
    }

    if (loan.lenderId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the requested lender can reject this loan' },
        { status: 403 }
      );
    }

    if (loan.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Cannot reject a loan in ${loan.status} status` },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const reasonText = body.reason || 'No reason provided';

    // Reject in transaction, notify borrower
    const updatedLoan = await prisma.$transaction(async (tx) => {
      const updated = await tx.loan.update({
        where: { id: loanId },
        data: {
          status: 'REJECTED',
        },
        include: {
          borrower: { select: { id: true, name: true, image: true, creditScore: true } },
          lender: { select: { id: true, name: true, image: true } },
        },
      });

      await tx.notification.create({
        data: {
          userId: loan.borrowerId,
          type: 'LOAN_REJECTED',
          title: 'Loan Request Rejected',
          message: `${loan.lender?.name || 'Someone'} rejected your loan request: "${reasonText}"`,
          data: { loanId, reason: reasonText },
        },
      });

      return updated;
    });

    const formattedLoan = {
      ...updatedLoan,
      dueDate: updatedLoan.repaymentDate.toISOString(),
      borrower: {
        id: updatedLoan.borrower.id,
        name: updatedLoan.borrower.name || 'Roommate',
        avatar: updatedLoan.borrower.image,
        creditScore: updatedLoan.borrower.creditScore,
      },
      lender: updatedLoan.lender ? {
        id: updatedLoan.lender.id,
        name: updatedLoan.lender.name || 'Roommate',
        avatar: updatedLoan.lender.image,
      } : null,
    };

    return NextResponse.json(formattedLoan);
  } catch (error) {
    console.error('Reject loan error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
