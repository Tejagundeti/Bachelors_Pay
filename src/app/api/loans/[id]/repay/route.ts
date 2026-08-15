import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { onTimePayment, latePayment } from '@/lib/services/credit-score';

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

    // Verify loan request exists and user is the borrower
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        borrower: { select: { id: true, name: true } },
        lender: { select: { id: true, name: true } },
      },
    });

    if (!loan) {
      return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
    }

    if (loan.borrowerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the borrower can repay this loan' },
        { status: 403 }
      );
    }

    if (loan.status !== 'APPROVED' && loan.status !== 'OVERDUE') {
      return NextResponse.json(
        { error: `Cannot repay a loan in ${loan.status} status` },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const repayAmount = body.amount || loan.amount;

    // Repay in transaction, log repayment, adjust credit score
    const updatedLoan = await prisma.$transaction(async (tx) => {
      // 1. Create repayment log
      await tx.loanRepayment.create({
        data: {
          loanId,
          amount: repayAmount,
          userId: session.user!.id!,
        },
      });

      // 2. Update loan status to REPAID
      const updated = await tx.loan.update({
        where: { id: loanId },
        data: {
          status: 'REPAID',
        },
        include: {
          borrower: { select: { id: true, name: true, image: true, creditScore: true } },
          lender: { select: { id: true, name: true, image: true } },
        },
      });

      // 3. Credit score reward/penalty
      const isOntime = new Date() <= new Date(loan.repaymentDate);
      if (isOntime) {
        // We'll run the logic, but since updateCreditScore uses its own transaction,
        // we can invoke the service function. To keep it safe inside the transaction, 
        // let's do the score increment here or let it run after. Since Prisma $transaction
        // can call external functions, we'll run updateCreditScore after or do it directly.
        // Let's do the DB update for creditScore directly here to keep it atomic in tx.
        const currentScore = updated.borrower.creditScore;
        const newScore = Math.min(900, currentScore + 5);
        await tx.user.update({
          where: { id: loan.borrowerId },
          data: { creditScore: newScore },
        });

        await tx.creditHistory.create({
          data: {
            userId: loan.borrowerId,
            scoreBefore: currentScore,
            scoreAfter: newScore,
            reason: 'On-time loan repayment',
          },
        });
      } else {
        const currentScore = updated.borrower.creditScore;
        const newScore = Math.max(300, currentScore - 10);
        await tx.user.update({
          where: { id: loan.borrowerId },
          data: { creditScore: newScore },
        });

        await tx.creditHistory.create({
          data: {
            userId: loan.borrowerId,
            scoreBefore: currentScore,
            scoreAfter: newScore,
            reason: 'Late loan repayment',
          },
        });
      }

      // 4. Notify lender
      await tx.notification.create({
        data: {
          userId: loan.lenderId!,
          type: 'PAYMENT_RECEIVED',
          title: 'Loan Repaid',
          message: `${loan.borrower?.name || 'Someone'} repaid the loan of ₹${repayAmount.toFixed(2)}`,
          data: { loanId },
        },
      });

      return updated;
    });

    // Refresh updated borrower details (specifically credit score)
    const freshBorrower = await prisma.user.findUnique({
      where: { id: updatedLoan.borrowerId },
      select: { creditScore: true },
    });

    const formattedLoan = {
      ...updatedLoan,
      dueDate: updatedLoan.repaymentDate.toISOString(),
      borrower: {
        id: updatedLoan.borrower.id,
        name: updatedLoan.borrower.name || 'Roommate',
        avatar: updatedLoan.borrower.image,
        creditScore: freshBorrower?.creditScore ?? updatedLoan.borrower.creditScore,
      },
      lender: updatedLoan.lender ? {
        id: updatedLoan.lender.id,
        name: updatedLoan.lender.name || 'Roommate',
        avatar: updatedLoan.lender.image,
      } : null,
    };

    return NextResponse.json(formattedLoan);
  } catch (error) {
    console.error('Repay loan error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
