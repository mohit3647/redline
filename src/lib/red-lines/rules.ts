export const MAX_RED_LINES = 20;
export const MAX_RED_LINE_CHARS = 500;

export type RedLineCheck = { ok: true; text: string } | { ok: false; message: string };

/** One red line as the signer typed it: trimmed, not empty, within the length limit. */
export function checkRedLineText(value: unknown): RedLineCheck {
  if (typeof value !== 'string') return { ok: false, message: 'A red line needs text.' };
  const text = value.trim();
  if (text.length === 0) return { ok: false, message: 'A red line needs text.' };
  if (text.length > MAX_RED_LINE_CHARS) {
    return { ok: false, message: `A red line can be at most ${MAX_RED_LINE_CHARS} characters. This one is ${text.length}.` };
  }
  return { ok: true, text };
}

/** Redline's own starting list (PRD section 5). Read-only, and not the signer's. */
export const DEFAULT_RED_LINES: readonly { id: string; text: string }[] = [
  { id: 'indemnity', text: 'The signer covers the client’s losses and legal costs with no upper limit.' },
  { id: 'ip', text: 'The signer assigns rights beyond the deliverable, such as earlier work, reusable tools or anything made during the engagement.' },
  { id: 'termination', text: 'The client can end the agreement at any time and owes no kill fee.' },
  { id: 'cap', text: 'The client’s liability to the signer is capped below the contract value while the signer’s is not.' },
  { id: 'non-compete', text: 'A non-compete or non-solicit limits the signer’s future work.' },
  { id: 'scope', text: 'The scope is undefined or revisions are unlimited.' },
  { id: 'amendment', text: 'The client can change the terms after signing.' },
];
