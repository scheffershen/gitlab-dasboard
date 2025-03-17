// Protecting routes with next-auth
// https://next-auth.js.org/configuration/nextjs#middleware
// https://nextjs.org/docs/app/building-your-application/routing/middleware

import NextAuth from 'next-auth';
import authConfig from '@/lib/auth.config';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  // Check if user is not authenticated
  if (!req.auth) {
    // Get base URL by removing the current path
    const url = req.url.replace(req.nextUrl.pathname, '/');
    // Redirect to base URL (login page)
    return Response.redirect(url);
  }
});

// Only run middleware on dashboard routes
export const config = { matcher: ['/dashboard/:path*'] };
