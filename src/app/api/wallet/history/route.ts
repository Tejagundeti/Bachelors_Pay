import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET: Full wallet transaction history with pagination
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
    });

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet not found for this room' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const type = searchParams.get('type'); // DEPOSIT, WITHDRAW, EXPENSE
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { walletId: wallet.id };
    if (type && ['DEPOSIT', 'WITHDRAW', 'EXPENSE'].includes(type)) {
      where.type = type;
    }

    const [transactions, total] = await Promise.all([
      prisma.walletTransaction.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.walletTransaction.count({ where }),
    ]);

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Wallet history error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
