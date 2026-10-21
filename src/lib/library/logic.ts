import { checkQuote } from '../analyse/analyse';
import { countBudgetFlags } from '../analyse/counts';
import type { Analysis, ContractValue } from '../analyse/types';

export const DOCUMENT_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** True for a well-formed uuid. Anything else is a 404 before the database is asked. */
export function isDocumentId(id: string): boolean {
  return DOCUMENT_ID_PATTERN.test(id);
}

export type Verification = { ok: true } | { ok: false; reason: string };

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * Every sentence an analysis would show as a quotation, in one list. Flags, cleared entries, flags
 * held back by the fee, and the fee sentences all render through Quotation.
 */
function quotedSentences(a: Analysis): unknown[] {
  const out: unknown[] = [];
  for (const f of a.flags) out.push(f.sourceSentence);
  for (const f of a.demoted) out.push(f.sourceSentence);
  for (const c of a.cleared) out.push(c.sourceSentence);
  if (a.fee?.state === 'extracted') out.push(a.fee.sourceSentence);
  if (a.extractedFee) out.push(a.extractedFee.sourceSentence);
  return out;
}

/**
 * The save guard and the read guard. A result is accepted only when it has the shape the view needs and
 * every sentence it would quote is an exact substring of the stored document text (ADR 0001).
 */
export function verifyAnalysis(documentText: string, analysis: unknown): Verification {
  if (!isObj(analysis)) return { ok: false, reason: 'The result is not an analysis.' };
  const a = analysis as Record<string, unknown>;
  const arrays = ['flags', 'cleared', 'absent', 'reclassified', 'dropped', 'demoted', 'order'];
  for (const k of arrays) {
    if (!Array.isArray(a[k])) return { ok: false, reason: `The result has no ${k} list.` };
  }
  if (typeof a.summary !== 'string' || !isObj(a.fee)) return { ok: false, reason: 'The result is missing its summary or fee.' };
  const typed = analysis as unknown as Analysis;
  for (const item of [...typed.flags, ...typed.cleared, ...typed.demoted]) {
    if (!isObj(item)) return { ok: false, reason: 'The result holds an entry that is not an object.' };
  }
  for (const s of quotedSentences(typed)) {
    if (typeof s !== 'string' || !checkQuote(documentText, s).ok) {
      return { ok: false, reason: 'A quoted sentence is not an exact match for the document text.' };
    }
  }
  return { ok: true };
}

export function isContractValue(v: unknown): v is ContractValue {
  return isObj(v) && typeof v.amount === 'number' && Number.isFinite(v.amount) && v.amount >= 0 &&
    typeof v.currency === 'string' && /^[A-Za-z]{3}$/.test(v.currency);
}

export type LibraryDocumentRow = { id: string; title: string; created_at: string | null };
export type LibraryAnalysisRow = { document_id: string; created_at: string | null; flags: unknown };

export type LibraryEntry = {
  id: string;
  title: string;
  createdAt: string | null;
  analysed: boolean;
  /** Risk flags in the most recent analysis. The confidentiality notice is not counted. Null when none exists. */
  flagCount: number | null;
};

function time(s: string | null): number {
  const t = s ? Date.parse(s) : NaN;
  return Number.isNaN(t) ? 0 : t;
}

/** One entry per document, newest first, with the flag count taken from the most recent analysis. */
export function shapeLibrary(documents: LibraryDocumentRow[], analyses: LibraryAnalysisRow[]): LibraryEntry[] {
  const latest = new Map<string, LibraryAnalysisRow>();
  for (const a of analyses) {
    const seen = latest.get(a.document_id);
    if (!seen || time(a.created_at) > time(seen.created_at)) latest.set(a.document_id, a);
  }
  return [...documents]
    .sort((x, y) => time(y.created_at) - time(x.created_at))
    .map((d) => {
      const a = latest.get(d.id);
      const flags = a && Array.isArray(a.flags) ? (a.flags as Analysis['flags']) : null;
      return {
        id: d.id,
        title: d.title,
        createdAt: d.created_at,
        analysed: a !== undefined,
        flagCount: flags ? countBudgetFlags({ flags }) : null,
      };
    });
}

/** Plain date for the list. Falls back to nothing rather than a guessed date. */
export function formatSavedDate(iso: string | null): string {
  const t = time(iso);
  if (!t) return '';
  return new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}
