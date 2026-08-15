import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

const withdrawSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  description: z.string().optional(),
});

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const validation = withdrawSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { amount, description } = validation.data;

    const wallet = await prisma.wallet.findUnique({
      where: { roomId: membership.roomId },
    });

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet not found for this room' },
        { status: 404 }
      );
    }

    // Check sufficient balance
    if (wallet.balance < amount) {
      return NextResponse.json(
        {
          error: 'Insufficient balance',
          currentBalance: wallet.balance,
          requestedAmount: amount,
        },
        { status: 400 }
      );
    }

    // Withdraw funds in a transaction
    const [updatedWallet, transaction] = await prisma.$transaction([
      prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: amount } },
      }),
      prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          userId: session.user.id,
          amount,
          type: 'WITHDRAW',
          description: description || `Withdrawal by ${session.user.name || 'user'}`,
        },
      }),
    ]);

    // Check if wallet balance is low and notify members
    if (updatedWallet.balance < 500) {
      const members = await prisma.roomMember.findMany({
        where: { roomId: membership.roomId },
      });

      await prisma.notification.createMany({
        data: members.map((member) => ({
          userId: member.userId,
          type: 'WALLET_LOW' as const,
          title: 'Low Wallet Balance',
          message: `Shared wallet balance is low (₹${updatedWallet.balance.toFixed(2)}). Consider adding funds.`,
          data: { walletId: wallet.id, balance: updatedWallet.balance },
        })),
      });
    }

    return NextResponse.json({
      message: 'Withdrawal successful',
      wallet: {
        id: updatedWallet.id,
        balance: updatedWallet.balance,
      },
      transaction,
    });
  } catch (error) {
    console.error('Wallet withdraw error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
