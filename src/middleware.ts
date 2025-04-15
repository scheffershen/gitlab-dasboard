// Protecting routes with next-auth
// https://next-auth.js.org/configuration/nextjs#middleware
// https://nextjs.org/docs/app/building-your-application/routing/middleware

import NextAuth from 'next-auth';
import authConfig from '@/lib/auth.config';
import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';

const { auth } = NextAuth(authConfig);

// Create intl middleware
const intlMiddleware = createMiddleware(routing);

// Combine both middlewares
export default auth(async function middleware(req) {
  // Protected routes check
  if (req.nextUrl.pathname.match(/^\/(en|fr)\/dashboard/)) {
    if (!req.auth) {
      const url = req.url.replace(req.nextUrl.pathname, '/');
      return Response.redirect(url);
    }
  }
  
  // Handle internationalization
  return intlMiddleware(req);
});

// Update matcher to handle both auth and i18n routes
export const config = {
  matcher: [
    // Auth protected routes
    '/(en|fr)dashboard/:path*',
    // i18n routes (exclude api, static files etc)
    '/((?!api|_next|.*\\..*).*)'
  ]
};
