'use server';

import { createClient } from '../supabase/server';
import { assessText } from '../parse/usable-text';

export type SaveResult =
  | { status: 'saved'; id: string }
  | { status: 'unconfigured' }
  | { status: 'signed-out' }
  | { status: 'error'; message: string };

const MAX_TITLE = 200;

/** Stores the extracted text for the signed-in signer. Row-level security scopes it to them. */
export async function saveDocument(title: string, text: string): Promise<SaveResult> {
  const verdict = assessText(String(text));
  if (!verdict.ok) return { status: 'error', message: verdict.message };
  const cleanTitle = String(title).trim().slice(0, MAX_TITLE) || 'Untitled agreement';

  const supabase = await createClient();
  if (!supabase) return { status: 'unconfigured' };
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { status: 'signed-out' };

  const { data, error } = await supabase
    .from('documents')
    .insert({ title: cleanTitle, text })
    .select('id')
    .single();
  if (error || !data) return { status: 'error', message: 'The text could not be saved. Try again in a moment.' };
  return { status: 'saved', id: data.id as string };
}
