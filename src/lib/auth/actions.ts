'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '../supabase/server';
import { SIGN_IN_PATH } from './routing';

export type SignInState = { status: 'idle' | 'sent' | 'error'; message: string; email: string };

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function siteOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') || host.startsWith('127.') ? 'http' : 'https');
  return `${proto}://${host}`;
}

export async function sendMagicLink(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const email = String(formData.get('email') ?? '').trim();
  if (!EMAIL_SHAPE.test(email)) {
    return { status: 'error', email, message: 'That does not look like an email address.' };
  }
  const supabase = await createClient();
  if (!supabase) {
    return { status: 'error', email, message: 'Sign-in is not set up on this deployment yet.' };
  }
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${await siteOrigin()}/auth/callback` },
  });
  if (error) {
    return { status: 'error', email, message: 'We could not send the link. Wait a minute and try again.' };
  }
  return { status: 'sent', email, message: '' };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  if (supabase) await supabase.auth.signOut();
  redirect(SIGN_IN_PATH);
}
