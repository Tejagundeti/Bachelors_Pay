import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';

export const authConfig = {
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const protectedRoutes = [
        '/dashboard',
        '/room',
        '/expenses',
        '/wallet',
        '/payments',
        '/analytics',
        '/loans',
        '/notifications',
        '/profile',
        '/settings',
      ];
      
      const isProtectedRoute = protectedRoutes.some((route) => 
        nextUrl.pathname.startsWith(route)
      );

      if (isProtectedRoute) {
        if (isLoggedIn) return true;
        return false; // Redirect to /login
      }
      
      if (isLoggedIn && (nextUrl.pathname === '/login' || nextUrl.pathname === '/signup')) {
        return Response.redirect(new URL('/dashboard', nextUrl));
      }
      
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export default authConfig;
