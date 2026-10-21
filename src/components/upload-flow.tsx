'use client';

import { useId, useRef, useState } from 'react';
import { AnalysisPanel } from './analysis-panel';
import { saveDocument } from '../lib/documents/actions';
import {
  ACCEPTED_EXTENSIONS,
  acknowledgeDisclosure,
  answerCounterparty,
  initialIntake,
  intakeStage,
  isPickerUsable,
  parseFile,
} from '../lib/parse';

export const PENDING_DOCUMENT_KEY = 'redline.pendingDocument';

type Extracted = { title: string; text: string };
type Kept = { where: 'library' | 'tab'; note: string; documentId?: string };

function titleFrom(filename: string): string {
  return filename.replace(/\.[^.]+$/, '').trim() || 'Untitled agreement';
}

export function UploadFlow({ configured }: { configured: boolean }) {
  const [intake, setIntake] = useState(initialIntake);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [extracted, setExtracted] = useState<Extracted | null>(null);
  const [kept, setKept] = useState<Kept | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const headingId = useId();
  const stage = intakeStage(intake);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError('');
    setExtracted(null);
    setKept(null);
    setBusy(true);
    const result = await parseFile(file);
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    setExtracted({ title: titleFrom(file.name), text: result.text });
  }

  async function keep() {
    if (!extracted) return;
    setError('');
    setBusy(true);
    try {
      sessionStorage.setItem(PENDING_DOCUMENT_KEY, JSON.stringify(extracted));
    } catch {
      // Storage can be blocked or full; the text is still on screen.
    }
    if (!configured) {
      setBusy(false);
      setKept({
        where: 'tab',
        note: 'The text is held in this browser tab only. Saving it to a library needs an account, and this deployment has none set up yet.',
      });
      return;
    }
    const saved = await saveDocument(extracted.title, extracted.text);
    setBusy(false);
    if (saved.status === 'saved') {
      setKept({ where: 'library', documentId: saved.id, note: 'Saved to your library. Only the text was stored, never the file.' });
    } else if (saved.status === 'error') {
      setError(saved.message);
    } else if (saved.status === 'signed-out') {
      setError('You are signed out. Sign in again to save this text.');
    } else {
      setKept({ where: 'tab', note: 'The text is held in this browser tab only. Saving needs an account setup.' });
    }
  }

  function startOver() {
    setIntake(initialIntake);
    setExtracted(null);
    setKept(null);
    setError('');
    try {
      sessionStorage.removeItem(PENDING_DOCUMENT_KEY);
    } catch {
      // ignore
    }
  }

  return (
    <div className="intake on-light">
      <h1 id={headingId} className="auth-title">New agreement</h1>

      {!configured ? (
        <p className="intake-note" role="note">
          Saving to a library needs an account setup, and this deployment has none yet. You can still upload
          a file and read the text Redline extracts from it.
        </p>
      ) : null}

      <section className="intake-step" aria-labelledby="step-disclosure">
        <p className="auth-kicker">Step 1 of 3</p>
        <h2 id="step-disclosure" className="intake-h">Before you upload</h2>
        <p className="auth-body">
          Redline opens your file in this browser and pulls the text out of it. That text is then sent to a
          third-party model provider, through OpenRouter, to be analysed. We use only routes set to zero data
          retention. The text still leaves your browser.
        </p>
        <p className="auth-body">
          Many client agreements and NDAs forbid sharing their contents with third parties. Check the
          confidentiality terms in yours before you continue.
        </p>
        {intake.disclosureAcknowledged ? (
          <p className="intake-done">You acknowledged this.</p>
        ) : (
          <button type="button" className="auth-button" onClick={() => setIntake(acknowledgeDisclosure(intake))}>
            I understand, continue
          </button>
        )}
      </section>

      {intake.disclosureAcknowledged ? (
        <section className="intake-step" aria-labelledby="step-counterparty">
          <p className="auth-kicker">Step 2 of 3</p>
          <h2 id="step-counterparty" className="intake-h">Can the client accept changes?</h2>
          <p className="auth-body">
            Redline drafts counter-offers, so it only helps when a named client can say yes to one. Answer for
            the document you are about to upload.
          </p>
          {stage === 'counterparty' ? (
            <div className="intake-choices" role="group" aria-labelledby="step-counterparty">
              <button type="button" className="auth-button" onClick={() => setIntake(answerCounterparty(intake, 'yes'))}>
                Yes, a named client can accept changes
              </button>
              <button type="button" className="intake-secondary" onClick={() => setIntake(answerCounterparty(intake, 'no'))}>
                No, it is a fixed form
              </button>
            </div>
          ) : stage === 'ready' ? (
            <p className="intake-done">You answered yes.</p>
          ) : null}
        </section>
      ) : null}

      {stage === 'refused' ? (
        <section className="intake-step intake-refusal" aria-labelledby="refused-title" role="status">
          <h2 id="refused-title" className="intake-h">Redline is not for this document</h2>
          <p className="auth-body">
            It works on agreements where someone can accept a change, such as a freelance contract with a
            named client. A fixed form has no one to send a counter-offer to, so Redline does not analyse it.
            Nothing was read or stored.
          </p>
          <button type="button" className="intake-secondary" onClick={startOver}>Start again</button>
        </section>
      ) : null}

      {isPickerUsable(intake) ? (
        <section className="intake-step" aria-labelledby="step-file">
          <p className="auth-kicker">Step 3 of 3</p>
          <h2 id="step-file" className="intake-h">Choose the agreement</h2>
          <label className="auth-label" htmlFor="agreement-file">Agreement file (.txt, .docx or .pdf)</label>
          <input
            ref={inputRef}
            id="agreement-file"
            type="file"
            className="auth-input"
            accept={ACCEPTED_EXTENSIONS.join(',')}
            disabled={busy}
            aria-describedby={error ? 'intake-error' : undefined}
            onChange={(e) => void onFile(e.target.files?.[0])}
          />
          {busy && !extracted ? <p className="auth-body" role="status">Reading the file in your browser.</p> : null}
        </section>
      ) : null}

      {error ? <p id="intake-error" className="auth-error" role="alert">{error}</p> : null}

      {extracted ? (
        <section className="intake-step" aria-labelledby="extracted-title">
          <h2 id="extracted-title" className="intake-h">Text from {extracted.title}</h2>
          <p className="auth-body">
            This is exactly what Redline extracted, and exactly what it will keep and quote from. If anything
            looks wrong, choose the file again.
          </p>
          <pre className="intake-text" tabIndex={0} aria-label="Extracted agreement text">{extracted.text}</pre>
          {kept ? (
            <p className="intake-done" role="status">{kept.note}</p>
          ) : (
            <button type="button" className="auth-button" disabled={busy} onClick={() => void keep()}>
              {busy ? 'Keeping' : configured ? 'Save this text' : 'Keep this text'}
            </button>
          )}
        </section>
      ) : null}

      {extracted && kept ? <AnalysisPanel text={extracted.text} documentId={kept.documentId} /> : null}
    </div>
  );
}
