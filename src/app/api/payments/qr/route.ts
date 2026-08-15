import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';

const qrSchema = z.object({
  upiId: z.string().min(1, 'UPI ID is required'),
  name: z.string().min(1, 'Name is required'),
  amount: z.number().positive('Amount must be positive'),
  note: z.string().optional(),
});

// POST: Generate QR code data for UPI payment
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validation = qrSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { upiId, name, amount, note } = validation.data;

    // Build UPI deep link string
    const params = new URLSearchParams({
      pa: upiId,
      pn: name,
      am: amount.toFixed(2),
      cu: 'INR',
    });

    if (note) {
      params.set('tn', note);
    }

    const upiLink = `upi://pay?${params.toString()}`;

    return NextResponse.json({
      upiLink,
      upiId,
      name,
      amount,
      currency: 'INR',
    });
  } catch (error) {
    console.error('Generate QR error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
