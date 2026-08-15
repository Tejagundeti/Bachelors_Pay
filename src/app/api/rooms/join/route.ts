import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

const joinRoomSchema = z.object({
  code: z.string().min(1, 'Room code is required').max(10),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validation = joinRoomSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { code } = validation.data;

    // Check if user is already in a room
    const existingMembership = await prisma.roomMember.findFirst({
      where: { userId: session.user.id },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: 'You are already a member of a room. Leave your current room first.' },
        { status: 400 }
      );
    }

    // Find the room by code
    const room = await prisma.room.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        members: true,
      },
    });

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found. Please check the code and try again.' },
        { status: 404 }
      );
    }

    // Check if room is locked
    if (room.isLocked) {
      return NextResponse.json(
        { error: 'This room is locked and not accepting new members.' },
        { status: 403 }
      );
    }

    // Check if room is full
    if (room.members.length >= room.maxMembers) {
      return NextResponse.json(
        { error: 'This room is full.' },
        { status: 400 }
      );
    }

    // Check if user is already a member (double-check)
    const alreadyMember = room.members.find(
      (m) => m.userId === session.user!.id
    );
    if (alreadyMember) {
      return NextResponse.json(
        { error: 'You are already a member of this room.' },
        { status: 400 }
      );
    }

    // Add user as MEMBER
    await prisma.roomMember.create({
      data: {
        userId: session.user.id,
        roomId: room.id,
        role: 'MEMBER',
      },
    });

    // Create notification for room members
    const notifications = room.members.map((member) => ({
      userId: member.userId,
      type: 'MEMBER_JOINED' as const,
      title: 'New Member',
      message: `${session.user!.name || 'A new user'} has joined the room.`,
      data: { roomId: room.id, userId: session.user!.id },
    }));

    if (notifications.length > 0) {
      await prisma.notification.createMany({ data: notifications });
    }

    // Fetch updated room
    const updatedRoom = await prisma.room.findUnique({
      where: { id: room.id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        wallet: true,
      },
    });

    return NextResponse.json(
      { message: 'Successfully joined the room', room: updatedRoom },
      { status: 200 }
    );
  } catch (error) {
    console.error('Join room error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
