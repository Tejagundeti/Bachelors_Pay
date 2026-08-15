import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify user is owner or admin
    const membership = await prisma.roomMember.findUnique({
      where: {
        userId_roomId: {
          userId: session.user.id,
          roomId: id,
        },
      },
    });

    if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Only room owners and admins can generate invite codes' },
        { status: 403 }
      );
    }

    // Check room exists
    const room = await prisma.room.findUnique({ where: { id } });
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Generate a unique invite code
    const inviteCode = uuidv4().substring(0, 8).toUpperCase();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invite = await prisma.inviteCode.create({
      data: {
        code: inviteCode,
        roomId: id,
        expiresAt,
      },
    });

    return NextResponse.json({
      inviteCode: invite.code,
      expiresAt: invite.expiresAt,
      roomCode: room.code,
    });
  } catch (error) {
    console.error('Generate invite error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
