import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/types/database';

function sanitizeSupabaseUrl(url: string | undefined): string {
  if (!url) return 'https://mock.supabase.co';
  let cleaned = url.trim().replace(/\/+$/, '');
  // Strip accidental /auth/v1, /rest/v1 or trailing path fragments
  cleaned = cleaned.replace(/\/(auth|rest|storage)\/v\d+.*$/, '');
  return cleaned.replace(/\/+$/, '') || 'https://mock.supabase.co';
}

/**
 * Creates a browser-side Supabase client for client components.
 */
export function createClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseUrl = sanitizeSupabaseUrl(rawUrl);
  const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key').trim();

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
