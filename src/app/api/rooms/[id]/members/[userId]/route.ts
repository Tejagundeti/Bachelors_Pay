import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: roomId, userId: targetUserId } = await params;

    // Verify current user is owner or admin
    const currentMembership = await prisma.roomMember.findUnique({
      where: {
        userId_roomId: {
          userId: session.user.id,
          roomId,
        },
      },
    });

    if (!currentMembership || (currentMembership.role !== 'OWNER' && currentMembership.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Only room owners and admins can remove members' },
        { status: 403 }
      );
    }

    // Find the target member
    const targetMembership = await prisma.roomMember.findUnique({
      where: {
        userId_roomId: {
          userId: targetUserId,
          roomId,
        },
      },
      include: {
        user: {
          select: { name: true },
        },
      },
    });

    if (!targetMembership) {
      return NextResponse.json(
        { error: 'User is not a member of this room' },
        { status: 404 }
      );
    }

    // Can't remove the owner
    if (targetMembership.role === 'OWNER') {
      return NextResponse.json(
        { error: 'Cannot remove the room owner. Transfer ownership first.' },
        { status: 400 }
      );
    }

    // Admin can't remove another admin (only owner can)
    if (targetMembership.role === 'ADMIN' && currentMembership.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only the owner can remove admins' },
        { status: 403 }
      );
    }

    // Remove member
    await prisma.roomMember.delete({
      where: { id: targetMembership.id },
    });

    // Notify removed user
    await prisma.notification.create({
      data: {
        userId: targetUserId,
        type: 'MEMBER_LEFT',
        title: 'Removed from Room',
        message: 'You have been removed from the room.',
        data: { roomId },
      },
    });

    // Notify remaining members
    const remainingMembers = await prisma.roomMember.findMany({
      where: { roomId },
    });

    if (remainingMembers.length > 0) {
      await prisma.notification.createMany({
        data: remainingMembers.map((member) => ({
          userId: member.userId,
          type: 'MEMBER_LEFT' as const,
          title: 'Member Removed',
          message: `${targetMembership.user.name || 'A member'} has been removed from the room.`,
          data: { roomId, removedUserId: targetUserId },
        })),
      });
    }

    return NextResponse.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
