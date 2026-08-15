import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

const depositSchema = z.object({
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
    const validation = depositSchema.safeParse(body);

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

    // Deposit funds in a transaction
    const [updatedWallet, transaction] = await prisma.$transaction([
      prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amount } },
      }),
      prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          userId: session.user.id,
          amount,
          type: 'DEPOSIT',
          description: description || `Deposit by ${session.user.name || 'user'}`,
        },
      }),
    ]);

    return NextResponse.json({
      message: 'Deposit successful',
      wallet: {
        id: updatedWallet.id,
        balance: updatedWallet.balance,
      },
      transaction,
    });
  } catch (error) {
    console.error('Wallet deposit error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
