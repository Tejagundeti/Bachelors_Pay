import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET: Get wallet balance and recent transactions for user's room
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

    const wallet = await prisma.wallet.findUnique({
      where: { roomId: membership.roomId },
      include: {
        transactions: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        },
      },
    });

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet not found for this room' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      wallet: {
        id: wallet.id,
        balance: wallet.balance,
        roomId: wallet.roomId,
        createdAt: wallet.createdAt,
        updatedAt: wallet.updatedAt,
      },
      recentTransactions: wallet.transactions,
    });
  } catch (error) {
    console.error('Get wallet error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
