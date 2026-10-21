import { assessText } from './usable-text';

export type ParseResult =
  | { ok: true; text: string; format: 'txt' | 'docx' | 'pdf' }
  | { ok: false; message: string };

export const ACCEPTED_EXTENSIONS = ['.txt', '.docx', '.pdf'] as const;

const UNSUPPORTED =
  'Redline reads .txt, .docx and .pdf files. Older .doc files and images are not supported.';

function extensionOf(name: string): string {
  const i = name.lastIndexOf('.');
  return i < 0 ? '' : name.slice(i).toLowerCase();
}

async function readDocx(file: Blob): Promise<string> {
  // Dynamic import keeps the parser out of the server bundle and out of pages that never parse.
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  // mammoth's browser build takes an ArrayBuffer; its Node build (used in tests) takes a Buffer.
  const input = typeof Buffer !== 'undefined' ? { buffer: Buffer.from(arrayBuffer) } : { arrayBuffer };
  const result = await mammoth.extractRawText(input);
  return result.value;
}

type PdfTextItem = { str?: string; hasEOL?: boolean };

/** Text layer only. Items are joined as the PDF emits them, with a newline where it marks a line end. */
export async function readPdf(file: Blob): Promise<string> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/legacy/build/pdf.worker.min.mjs', import.meta.url).toString();
  }
  const data = new Uint8Array(await file.arrayBuffer());
  const task = pdfjs.getDocument({ data });
  const doc = await task.promise;
  const pages: string[] = [];
  try {
    for (let n = 1; n <= doc.numPages; n++) {
      const page = await doc.getPage(n);
      const content = await page.getTextContent();
      let out = '';
      for (const item of content.items as PdfTextItem[]) {
        if (typeof item.str !== 'string') continue;
        out += item.str + (item.hasEOL ? '\n' : '');
      }
      pages.push(out);
    }
  } finally {
    await task.destroy();
  }
  return pages.join('\n\n');
}

/** Parses in the caller's process (the browser, in the app). The file is never sent anywhere. */
export async function parseFile(file: File): Promise<ParseResult> {
  const ext = extensionOf(file.name);
  let text: string;
  let format: 'txt' | 'docx' | 'pdf';
  try {
    if (ext === '.txt') {
      format = 'txt';
      text = await file.text();
    } else if (ext === '.docx') {
      format = 'docx';
      text = await readDocx(file);
    } else if (ext === '.pdf') {
      format = 'pdf';
      text = await readPdf(file);
    } else {
      return { ok: false, message: UNSUPPORTED };
    }
  } catch {
    return { ok: false, message: 'This file could not be opened. It may be damaged or password protected.' };
  }
  const verdict = assessText(text);
  if (!verdict.ok) return { ok: false, message: verdict.message };
  return { ok: true, text, format };
}
