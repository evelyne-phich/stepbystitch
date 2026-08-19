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
    return { error: 'Please provide both email and password.' };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message || 'Invalid login credentials.' };
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
    return { error: 'Please provide both email and a password.' };
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters long.' };
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
    return { error: error.message || 'Error creating account.' };
  }

  // If user session is established immediately
  if (data.session) {
    revalidatePath('/', 'layout');
    redirect('/library');
  }

  return { success: true, message: 'Account created successfully! If email verification is enabled, please check your inbox.' };
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
