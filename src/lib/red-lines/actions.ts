'use server';

import { createClient } from '../supabase/server';
import { checkRedLineText, MAX_RED_LINES } from './rules';

export type SavedRedLine = { id: string; text: string };

export type ListResult =
  | { status: 'ok'; redLines: SavedRedLine[] }
  | { status: 'unconfigured' }
  | { status: 'signed-out' }
  | { status: 'error'; message: string };

export type WriteResult =
  | { status: 'ok'; redLines: SavedRedLine[] }
  | { status: 'unconfigured' }
  | { status: 'signed-out' }
  | { status: 'invalid'; message: string }
  | { status: 'error'; message: string };

const FAILED = 'The red lines could not be saved. Try again in a moment.';

async function session() {
  const supabase = await createClient();
  if (!supabase) return { kind: 'unconfigured' as const };
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { kind: 'signed-out' as const };
  return { kind: 'ready' as const, supabase };
}

async function load(supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>): Promise<SavedRedLine[] | null> {
  const { data, error } = await supabase
    .from('red_lines')
    .select('id, text')
    .order('position', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true });
  if (error || !data) return null;
  return data.map((r) => ({ id: String(r.id), text: String(r.text) }));
}

/** The signer's red lines, oldest first. Row-level security scopes the read to them. */
export async function listRedLines(): Promise<ListResult> {
  const s = await session();
  if (s.kind !== 'ready') return { status: s.kind };
  const rows = await load(s.supabase);
  return rows ? { status: 'ok', redLines: rows } : { status: 'error', message: 'The red lines could not be loaded.' };
}

export async function addRedLine(text: string): Promise<WriteResult> {
  const check = checkRedLineText(text);
  if (!check.ok) return { status: 'invalid', message: check.message };
  const s = await session();
  if (s.kind !== 'ready') return { status: s.kind };
  const existing = await load(s.supabase);
  if (!existing) return { status: 'error', message: FAILED };
  if (existing.length >= MAX_RED_LINES) {
    return { status: 'invalid', message: `You can keep at most ${MAX_RED_LINES} red lines. Remove one to add another.` };
  }
  const { error } = await s.supabase.from('red_lines').insert({ text: check.text, position: existing.length });
  if (error) return { status: 'error', message: FAILED };
  const rows = await load(s.supabase);
  return rows ? { status: 'ok', redLines: rows } : { status: 'error', message: FAILED };
}

export async function updateRedLine(id: string, text: string): Promise<WriteResult> {
  const check = checkRedLineText(text);
  if (!check.ok) return { status: 'invalid', message: check.message };
  const s = await session();
  if (s.kind !== 'ready') return { status: s.kind };
  const { error } = await s.supabase.from('red_lines').update({ text: check.text }).eq('id', String(id));
  if (error) return { status: 'error', message: FAILED };
  const rows = await load(s.supabase);
  return rows ? { status: 'ok', redLines: rows } : { status: 'error', message: FAILED };
}

export async function removeRedLine(id: string): Promise<WriteResult> {
  const s = await session();
  if (s.kind !== 'ready') return { status: s.kind };
  const { error } = await s.supabase.from('red_lines').delete().eq('id', String(id));
  if (error) return { status: 'error', message: FAILED };
  const rows = await load(s.supabase);
  return rows ? { status: 'ok', redLines: rows } : { status: 'error', message: FAILED };
}
