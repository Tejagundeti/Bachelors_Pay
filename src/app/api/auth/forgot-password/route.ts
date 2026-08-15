import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import prisma from '@/lib/prisma';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = forgotPasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // If user exists, generate and store reset token
    if (user) {
      const resetToken = uuidv4();
      const expires = new Date(Date.now() + 3600000); // 1 hour from now

      // Delete any existing tokens for this email
      await prisma.verificationToken.deleteMany({
        where: { identifier: email },
      });

      // Create new verification token
      await prisma.verificationToken.create({
        data: {
          identifier: email,
          token: resetToken,
          expires,
        },
      });

      // In production, send email with reset link
      // For now, log to console
      console.log(`[Password Reset] Token for ${email}: ${resetToken}`);
      console.log(`[Password Reset] Reset link: ${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`);
    }

    // Always return success for security (don't reveal if user exists)
    return NextResponse.json({
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
