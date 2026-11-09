/** Fewer non-whitespace characters than this and the file is treated as having no text layer. */
export const MIN_USABLE_CHARS = 50;

export type TextAssessment =
  | { ok: true }
  | { ok: false; reason: 'no-text' | 'too-short' | 'unstorable'; message: string };

export const NO_TEXT_MESSAGE =
  'We could not find readable text in this file. If it is a scan or a photo of a page, Redline cannot read it: there is no OCR, because a quote taken from misread text would be worthless. Ask the client for a text version, or export the agreement from the program that made it.';

export const TOO_SHORT_MESSAGE =
  'This file has too little text to be an agreement, so Redline did not keep it. Choose the whole agreement. If this file is a scan or a photo of a page, Redline cannot read it: there is no OCR.';

export const UNSTORABLE_MESSAGE =
  'This file contains null characters, so the text cannot be stored exactly as extracted. Export the agreement again as a plain document.';

/** Decides whether extracted text is worth storing and analysing. No repair is attempted. */
export function assessText(text: string): TextAssessment {
  const visible = text.replace(/\s+/g, '').length;
  if (visible === 0) return { ok: false, reason: 'no-text', message: NO_TEXT_MESSAGE };
  if (visible < MIN_USABLE_CHARS) return { ok: false, reason: 'too-short', message: TOO_SHORT_MESSAGE };
  if (text.includes('\u0000')) return { ok: false, reason: 'unstorable', message: UNSTORABLE_MESSAGE };
  return { ok: true };
}
