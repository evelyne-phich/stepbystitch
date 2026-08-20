'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * Server Action for authenticating an existing user with email and password.
 */
export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = (formData.get('email') as string)?.trim();
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { errorCode: 'MISSING_FIELDS' };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { errorCode: 'INVALID_CREDENTIALS', rawMessage: error.message };
  }

  revalidatePath('/', 'layout');
  redirect('/library');
}

/**
 * Server Action for registering a new user account with their preferred pattern language.
 */
export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = (formData.get('email') as string)?.trim();
  const password = formData.get('password') as string;
  const fullName = ((formData.get('fullName') as string) || '').trim();
  const languePreferee = (formData.get('languePreferee') as string) || 'fr';

  if (!email || !password) {
    return { errorCode: 'MISSING_FIELDS' };
  }

  // Anti-abuse: Block disposable temporary email providers
  const { isDisposableEmail } = await import('@/lib/auth/email-validator');
  if (isDisposableEmail(email)) {
    return { errorCode: 'DISPOSABLE_EMAIL' };
  }

  if (password.length < 6) {
    return { errorCode: 'PASSWORD_TOO_SHORT' };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        langue_preferee: languePreferee,
      },
    },
  });

  if (error) {
    return { errorCode: 'AUTH_ERROR', rawMessage: error.message };
  }

  // If user session is established immediately
  if (data.session) {
    revalidatePath('/', 'layout');
    redirect('/library');
  }

  return { success: true, messageCode: 'SIGNUP_SUCCESS_CONFIRM' };
}

/**
 * Server Action for signing out the current user session.
 */
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}
