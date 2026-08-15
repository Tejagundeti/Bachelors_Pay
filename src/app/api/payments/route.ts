import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

const createPaymentSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  receiverId: z.string().min(1, 'Receiver ID is required'),
  method: z.enum(['UPI', 'QR', 'BANK_TRANSFER', 'CASH', 'WALLET', 'RAZORPAY']),
  expenseId: z.string().optional(),
  transactionId: z.string().optional(),
  notes: z.string().optional(),
});

// GET: Payment history for user (sent and received)
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const type = searchParams.get('type'); // 'sent' or 'received'
    const skip = (page - 1) * limit;

    let where: Record<string, unknown>;

    if (type === 'sent') {
      where = { senderId: session.user.id };
    } else if (type === 'received') {
      where = { receiverId: session.user.id };
    } else {
      where = {
        OR: [
          { senderId: session.user.id },
          { receiverId: session.user.id },
        ],
      };
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          sender: {
            select: { id: true, name: true, email: true, image: true },
          },
          receiver: {
            select: { id: true, name: true, email: true, image: true },
          },
          expense: {
            select: { id: true, title: true, amount: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ]);

    return NextResponse.json({
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get payments error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Record a payment
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validation = createPaymentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { amount, receiverId, method, expenseId, transactionId, notes } = validation.data;

    // Can't pay yourself
    if (receiverId === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot send a payment to yourself' },
        { status: 400 }
      );
    }

    // Verify receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true, name: true },
    });

    if (!receiver) {
      return NextResponse.json(
        { error: 'Receiver not found' },
        { status: 404 }
      );
    }

    // Create payment and optionally update expense split
    const payment = await prisma.$transaction(async (tx) => {
      const newPayment = await tx.payment.create({
        data: {
          amount,
          senderId: session.user!.id!,
          receiverId,
          method,
          status: 'SUCCESS',
          expenseId: expenseId || null,
          transactionId: transactionId || null,
          notes,
        },
        include: {
          sender: {
            select: { id: true, name: true, email: true, image: true },
          },
          receiver: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      });

      // If linked to an expense, update the expense split
      if (expenseId) {
        const split = await tx.expenseSplit.findUnique({
          where: {
            expenseId_userId: {
              expenseId,
              userId: session.user!.id!,
            },
          },
        });

        if (split && !split.isPaid) {
          await tx.expenseSplit.update({
            where: { id: split.id },
            data: {
              isPaid: true,
              paidAt: new Date(),
            },
          });

          // Check if all splits are now paid
          const unpaidSplits = await tx.expenseSplit.count({
            where: {
              expenseId,
              isPaid: false,
            },
          });

          // If all splits are paid, mark expense as paid
          if (unpaidSplits === 0) {
            await tx.expense.update({
              where: { id: expenseId },
              data: { isPaid: true },
            });
          }
        }
      }

      // Create notification for receiver
      await tx.notification.create({
        data: {
          userId: receiverId,
          type: 'PAYMENT_RECEIVED',
          title: 'Payment Received',
          message: `${session.user!.name || 'Someone'} sent you ₹${amount.toFixed(2)} via ${method}`,
          data: {
            paymentId: newPayment.id,
            amount,
            method,
          },
        },
      });

      return newPayment;
    });

    return NextResponse.json(
      { message: 'Payment recorded successfully', payment },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create payment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
