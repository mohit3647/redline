'use client';

import { useState } from 'react';
import { retier } from '../lib/analyse/tier';
import type { Analysis, ContractValue } from '../lib/analyse/types';
import { AnalysisView, NotLegalAdvice } from './analysis-view';

type State =
  | { s: 'idle' }
  | { s: 'analysing' }
  | { s: 'failed'; message: string }
  | { s: 'ok'; analysis: Analysis; value?: ContractValue };

export function AnalysisPanel({ text }: { text: string }) {
  const [state, setState] = useState<State>({ s: 'idle' });

  async function run() {
    setState({ s: 'analysing' });
    try {
      const res = await fetch('/api/analyse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, redLines: [] }),
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
        <AnalysisView
          analysis={retier(state.analysis, state.value)}
          onContractValue={(v) => setState({ ...state, value: v ?? undefined })}
        />
      ) : (
        <>
          <NotLegalAdvice />
          {state.s === 'analysing' ? (
            <p className="auth-body" role="status">Analysing. This takes a minute or two.</p>
          ) : (
            <>
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
