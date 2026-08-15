import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';
import { NextRequest } from 'next/server';

const { auth } = NextAuth(authConfig);

export function middleware(request: NextRequest) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return auth(request as any);
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/room/:path*',
    '/expenses/:path*',
    '/wallet/:path*',
    '/payments/:path*',
    '/analytics/:path*',
    '/loans/:path*',
    '/notifications/:path*',
    '/profile/:path*',
    '/settings/:path*',
  ],
};
