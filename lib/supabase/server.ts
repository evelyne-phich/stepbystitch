import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/types/database';

function sanitizeSupabaseUrl(url: string | undefined): string {
  if (!url) return 'https://mock.supabase.co';
  let cleaned = url.trim().replace(/\/+$/, '');
  cleaned = cleaned.replace(/\/(auth|rest|storage)\/v\d+.*$/, '');
  return cleaned.replace(/\/+$/, '') || 'https://mock.supabase.co';
}

/**
 * Creates a server-side Supabase client with cookie storage support for Server Components and Server Actions.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseUrl = sanitizeSupabaseUrl(rawUrl);
  const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key').trim();

  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component context (cannot set cookies directly)
          }
        },
      },
    }
  );
}

/**
 * Creates an administrative Supabase client using the Service Role Key (strictly for backend admin jobs/tests).
 */
export async function createAdminClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseUrl = sanitizeSupabaseUrl(rawUrl);
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-service-role-key').trim();

  return createServerClient<Database>(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
      },
      cookies: {
        getAll() {
          return [];
        },
        setAll() {},
      },
    }
  );
}
