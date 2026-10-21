import type { Analysis, ContractValue } from '../analyse/types';
import { createClient } from '../supabase/server';
import { isContractValue, isDocumentId, shapeLibrary, verifyAnalysis } from './logic';
import type { LibraryEntry } from './logic';

export type LibraryList =
  | { status: 'ok'; entries: LibraryEntry[] }
  | { status: 'error' };

/** The signer's documents. Row-level security scopes both reads to them. */
export async function listLibrary(): Promise<LibraryList> {
  const supabase = await createClient();
  if (!supabase) return { status: 'error' };
  const docs = await supabase.from('documents').select('id, title, created_at').order('created_at', { ascending: false });
  const analyses = await supabase.from('analyses').select('document_id, created_at, flags:result->flags');
  if (docs.error || analyses.error || !docs.data || !analyses.data) return { status: 'error' };
  return { status: 'ok', entries: shapeLibrary(docs.data, analyses.data) };
}

export type StoredDocument =
  | { status: 'not-found' }
  | { status: 'error' }
  | {
      status: 'ok';
      id: string;
      title: string;
      text: string;
      createdAt: string | null;
      stored: { analysis: Analysis; contractValue?: ContractValue; createdAt: string | null } | null;
      /** True when a stored analysis exists but failed the quote check, so it is withheld. */
      withheld: boolean;
    };

export async function loadStoredDocument(id: string): Promise<StoredDocument> {
  if (!isDocumentId(id)) return { status: 'not-found' };
  const supabase = await createClient();
  if (!supabase) return { status: 'error' };
  const doc = await supabase.from('documents').select('id, title, text, created_at').eq('id', id).maybeSingle();
  if (doc.error) return { status: 'error' };
  if (!doc.data) return { status: 'not-found' };
  const latest = await supabase
    .from('analyses')
    .select('result, contract_value, created_at')
    .eq('document_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latest.error) return { status: 'error' };
  const base = { status: 'ok' as const, id: String(doc.data.id), title: String(doc.data.title), text: String(doc.data.text), createdAt: doc.data.created_at as string | null };
  if (!latest.data) return { ...base, stored: null, withheld: false };
  // The quote check runs again on the way out, so a bad row can never put an unverified quote on screen.
  if (!verifyAnalysis(base.text, latest.data.result).ok) return { ...base, stored: null, withheld: true };
  return {
    ...base,
    stored: {
      analysis: latest.data.result as Analysis,
      contractValue: isContractValue(latest.data.contract_value) ? latest.data.contract_value : undefined,
      createdAt: latest.data.created_at as string | null,
    },
    withheld: false,
  };
}
