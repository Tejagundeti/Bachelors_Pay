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

    const { id: roomId } = await params;

    // Check if the user is a member of the room
    const membership = await prisma.roomMember.findUnique({
      where: {
        userId_roomId: {
          userId: session.user.id,
          roomId,
        },
      },
      include: {
        user: { select: { name: true } },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'You are not a member of this room' },
        { status: 400 }
      );
    }

    // Owner checks
    if (membership.role === 'OWNER') {
      const memberCount = await prisma.roomMember.count({
        where: { roomId },
      });

      if (memberCount > 1) {
        return NextResponse.json(
          { error: 'As the room owner, you must transfer ownership to another member before leaving.' },
          { status: 400 }
        );
      }

      // If owner is the only member left, deleting the room is required. Or we can auto-delete the room.
      // Let's delete the room completely since they are the last member.
      await prisma.room.delete({
        where: { id: roomId },
      });

      return NextResponse.json({ message: 'Left the room and room was disbanded successfully.' });
    }

    // Delete membership
    await prisma.roomMember.delete({
      where: { id: membership.id },
    });

    // Notify other room members
    const remainingMembers = await prisma.roomMember.findMany({
      where: { roomId },
    });

    if (remainingMembers.length > 0) {
      await prisma.notification.createMany({
        data: remainingMembers.map((member) => ({
          userId: member.userId,
          type: 'MEMBER_LEFT' as const,
          title: 'Roommate Left',
          message: `${membership.user.name || 'A member'} has left the room.`,
          data: { roomId, leftUserId: session.user.id },
        })),
      });
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'MEMBER_LEAVE',
        details: { userId: session.user.id, roomId },
        userId: session.user.id,
        roomId,
      },
    });

    return NextResponse.json({ message: 'You have left the room successfully.' });
  } catch (error) {
    console.error('Leave room API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
