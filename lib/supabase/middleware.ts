import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

function sanitizeSupabaseUrl(url: string | undefined): string {
  if (!url) return 'https://mock.supabase.co';
  let cleaned = url.trim().replace(/\/+$/, '');
  cleaned = cleaned.replace(/\/(auth|rest|storage)\/v\d+.*$/, '');
  return cleaned.replace(/\/+$/, '') || 'https://mock.supabase.co';
}

/**
 * Updates and refreshes Supabase authentication sessions in the Next.js middleware pipeline.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseUrl = sanitizeSupabaseUrl(rawUrl);
  const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key').trim();

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do not run application logic between createServerClient and supabase.auth.getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/signup');
  const isDashboardRoute = request.nextUrl.pathname.startsWith('/library') || request.nextUrl.pathname.startsWith('/settings');

  // If user is already authenticated and visits login/signup, redirect to library
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/library';
    return NextResponse.redirect(url);
  }

  // If user is not authenticated and attempts to access protected routes
  if (!user && isDashboardRoute && rawUrl && !rawUrl.includes('mock')) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
