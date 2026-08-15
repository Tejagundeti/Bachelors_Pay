import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Generate a unique 6-character alphanumeric room code
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude easily confused chars
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

const createRoomSchema = z.object({
  name: z.string().min(2, 'Room name must be at least 2 characters').max(50),
  maxMembers: z.number().int().min(2).max(20).default(6),
});

// GET: Get user's current room with all members
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the user's room membership
    const membership = await prisma.roomMember.findFirst({
      where: { userId: session.user.id },
      include: {
        room: {
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
                  },
                },
              },
              orderBy: { joinedAt: 'asc' },
            },
            wallet: true,
          },
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ room: null });
    }

    return NextResponse.json({ room: membership.room, role: membership.role });
  } catch (error) {
    console.error('Get room error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create a new room
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    const body = await req.json();
    const validation = createRoomSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, maxMembers } = validation.data;

    // Generate a unique room code with retry logic
    let code: string;
    let isUnique = false;
    let attempts = 0;
    do {
      code = generateRoomCode();
      const existing = await prisma.room.findUnique({ where: { code } });
      isUnique = !existing;
      attempts++;
    } while (!isUnique && attempts < 10);

    if (!isUnique) {
      return NextResponse.json(
        { error: 'Failed to generate unique room code. Please try again.' },
        { status: 500 }
      );
    }

    // Create room, wallet, and add creator as owner in a transaction
    const room = await prisma.$transaction(async (tx) => {
      const newRoom = await tx.room.create({
        data: {
          name,
          code,
          maxMembers,
        },
      });

      // Create wallet for the room
      await tx.wallet.create({
        data: {
          roomId: newRoom.id,
          balance: 0,
        },
      });

      // Add creator as OWNER
      await tx.roomMember.create({
        data: {
          userId: session.user!.id!,
          roomId: newRoom.id,
          role: 'OWNER',
        },
      });

      // Return room with relations
      return tx.room.findUnique({
        where: { id: newRoom.id },
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
    });

    return NextResponse.json(
      { message: 'Room created successfully', room },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create room error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
