import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

const transferSchema = z.object({
  newOwnerId: z.string().min(1, 'New owner ID is required'),
});

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

    // Verify current user is the owner
    const currentMembership = await prisma.roomMember.findUnique({
      where: {
        userId_roomId: {
          userId: session.user.id,
          roomId: id,
        },
      },
    });

    if (!currentMembership || currentMembership.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only the room owner can transfer ownership' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validation = transferSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { newOwnerId } = validation.data;

    // Can't transfer to yourself
    if (newOwnerId === session.user.id) {
      return NextResponse.json(
        { error: 'You are already the owner' },
        { status: 400 }
      );
    }

    // Verify new owner is a member of the room
    const newOwnerMembership = await prisma.roomMember.findUnique({
      where: {
        userId_roomId: {
          userId: newOwnerId,
          roomId: id,
        },
      },
    });

    if (!newOwnerMembership) {
      return NextResponse.json(
        { error: 'The specified user is not a member of this room' },
        { status: 400 }
      );
    }

    // Transfer ownership in a transaction
    await prisma.$transaction([
      // Demote current owner to MEMBER
      prisma.roomMember.update({
        where: { id: currentMembership.id },
        data: { role: 'MEMBER' },
      }),
      // Promote new owner
      prisma.roomMember.update({
        where: { id: newOwnerMembership.id },
        data: { role: 'OWNER' },
      }),
    ]);

    // Notify the new owner
    await prisma.notification.create({
      data: {
        userId: newOwnerId,
        type: 'ROOM_INVITE',
        title: 'Ownership Transferred',
        message: `${session.user.name || 'The previous owner'} has transferred room ownership to you.`,
        data: { roomId: id },
      },
    });

    return NextResponse.json({
      message: 'Ownership transferred successfully',
    });
  } catch (error) {
    console.error('Transfer ownership error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
