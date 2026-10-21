'use client';

import { useEffect, useState } from 'react';
import { retier } from '../lib/analyse/tier';
import type { Analysis, ContractValue } from '../lib/analyse/types';
import { listRedLines } from '../lib/red-lines/actions';
import { readSessionRedLines } from '../lib/red-lines/session-store';
import { AnalysisView, NotLegalAdvice } from './analysis-view';

type State =
  | { s: 'idle' }
  | { s: 'analysing' }
  | { s: 'failed'; message: string }
  | { s: 'ok'; analysis: Analysis; value?: ContractValue };

/** The signer's own red lines: from their account when one is connected, otherwise from this tab. */
async function loadRedLines(): Promise<{ texts: string[]; note: string | null }> {
  const r = await listRedLines();
  if (r.status === 'ok') return { texts: r.redLines.map((x) => x.text), note: null };
  if (r.status === 'unconfigured') return { texts: readSessionRedLines().map((x) => x.text), note: null };
  return { texts: [], note: 'Your saved red lines could not be loaded, so this run used none.' };
}

export function AppliedRedLines({ texts, note }: { texts: string[]; note: string | null }) {
  return (
    <div className="applied-lines" role="note">
      {note ? <p className="auth-error">{note}</p> : null}
      {texts.length === 0 ? (
        <p className="auth-body">No red lines of yours were applied. <a href="/app/red-lines">Add some</a> to change what gets flagged.</p>
      ) : (
        <>
          <p className="auth-body">
            Red lines applied ({texts.length}). <a href="/app/red-lines">Edit them</a>
          </p>
          <ul>
            {texts.map((t, i) => <li key={i}>{t}</li>)}
          </ul>
        </>
      )}
    </div>
  );
}

export function AnalysisPanel({ text }: { text: string }) {
  const [state, setState] = useState<State>({ s: 'idle' });
  const [applied, setApplied] = useState<{ texts: string[]; note: string | null }>({ texts: [], note: null });

  // Show what would be applied before the first run, so the signer sees it ahead of the click.
  useEffect(() => {
    let live = true;
    void loadRedLines().then((r) => live && setApplied(r));
    return () => { live = false; };
  }, []);

  async function run() {
    setState({ s: 'analysing' });
    try {
      // Read the list again on every run so an edit made in another tab is picked up.
      const rl = await loadRedLines();
      setApplied(rl);
      const res = await fetch('/api/analyse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, redLines: rl.texts.map((t) => ({ text: t })) }),
      });
      const body = (await res.json()) as { status?: string; message?: string; analysis?: Analysis };
      if (res.ok && body.status === 'ok' && body.analysis) setState({ s: 'ok', analysis: body.analysis });
      else setState({ s: 'failed', message: body.message ?? 'The analysis failed. Nothing was analysed.' });
    } catch {
      setState({ s: 'failed', message: 'Redline could not reach the analysis service. Nothing was analysed.' });
    }
  }

  return (
    <section className="intake-step" aria-labelledby="analyse-h">
      <h2 id="analyse-h" className="intake-h">Analysis</h2>
      {state.s === 'ok' ? (
        <>
          <AppliedRedLines texts={applied.texts} note={applied.note} />
          <button type="button" className="intake-secondary" onClick={() => void run()}>Re-run with my red lines</button>
          <AnalysisView
            analysis={retier(state.analysis, state.value)}
            onContractValue={(v) => setState({ ...state, value: v ?? undefined })}
          />
        </>
      ) : (
        <>
          <NotLegalAdvice />
          {state.s === 'analysing' ? (
            <p className="auth-body" role="status">Analysing. This takes a minute or two.</p>
          ) : (
            <>
              <AppliedRedLines texts={applied.texts} note={applied.note} />
              {state.s === 'failed' ? <p className="auth-error" role="alert">{state.message}</p> : null}
              <button type="button" className="auth-button" onClick={() => void run()}>
                {state.s === 'failed' ? 'Try again' : 'Analyse this agreement'}
              </button>
            </>
          )}
        </>
      )}
    </section>
  );
}
