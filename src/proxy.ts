import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'tabancura_default_super_secret_key_change_me_in_prod';
const key = new TextEncoder().encode(JWT_SECRET);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Exclude static resources and api routes from middleware checks
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const sessionToken = request.cookies.get('session')?.value;

  // Root path redirect
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Protect Dashboard Routes
  if (pathname.startsWith('/dashboard')) {
    if (!sessionToken) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      // Decode and verify the JWT
      const { payload } = await jwtVerify(sessionToken, key);
      const role = payload.role as string;

      // Admin-only routes
      if (pathname.startsWith('/dashboard/users') && role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

      // External-only routes (if any, like dedicated registers)
      // If administrative external wants to register, dashboard/register is accessible to admin & external
      if (pathname.startsWith('/dashboard/register') && (role === 'internal' || role === 'reader')) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

      return NextResponse.next();
    } catch (error) {
      // Invalid token, clear it and redirect to login
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('session');
      return response;
    }
  }

  // Redirect to Dashboard if already logged in and visiting Login
  if (pathname === '/login') {
    if (sessionToken) {
      try {
        await jwtVerify(sessionToken, key);
        return NextResponse.redirect(new URL('/dashboard', request.url));
      } catch (error) {
        // Token is invalid, let them see the login page
        const response = NextResponse.next();
        response.cookies.delete('session');
        return response;
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
