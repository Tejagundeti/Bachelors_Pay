import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

const updateRoomSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  maxMembers: z.number().int().min(2).max(20).optional(),
  isLocked: z.boolean().optional(),
});

// GET: Get room details with members, expenses, and wallet
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify user is a member of this room
    const membership = await prisma.roomMember.findUnique({
      where: {
        userId_roomId: {
          userId: session.user.id,
          roomId: id,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'You are not a member of this room' },
        { status: 403 }
      );
    }

    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                phone: true,
                creditScore: true,
              },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
        expenses: {
          take: 10,
          orderBy: { date: 'desc' },
          include: {
            paidBy: {
              select: { id: true, name: true, image: true },
            },
            splits: {
              include: {
                user: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
        wallet: true,
      },
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    return NextResponse.json({ room, role: membership.role });
  } catch (error) {
    console.error('Get room error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Update room (owner only)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify user is the owner
    const membership = await prisma.roomMember.findUnique({
      where: {
        userId_roomId: {
          userId: session.user.id,
          roomId: id,
        },
      },
    });

    if (!membership || membership.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only the room owner can update room settings' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validation = updateRoomSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updateData = validation.data;

    // If reducing maxMembers, check current member count
    if (updateData.maxMembers) {
      const memberCount = await prisma.roomMember.count({
        where: { roomId: id },
      });
      if (updateData.maxMembers < memberCount) {
        return NextResponse.json(
          { error: `Cannot reduce max members below current count (${memberCount})` },
          { status: 400 }
        );
      }
    }

    const updatedRoom = await prisma.room.update({
      where: { id },
      data: updateData,
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        },
        wallet: true,
      },
    });

    return NextResponse.json({ room: updatedRoom });
  } catch (error) {
    console.error('Update room error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Delete room (owner only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify user is the owner
    const membership = await prisma.roomMember.findUnique({
      where: {
        userId_roomId: {
          userId: session.user.id,
          roomId: id,
        },
      },
    });

    if (!membership || membership.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only the room owner can delete the room' },
        { status: 403 }
      );
    }

    // Delete room (cascade will handle related records)
    await prisma.room.delete({ where: { id } });

    return NextResponse.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Delete room error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
