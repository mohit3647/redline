'use client';

import { useState } from 'react';
import { retier } from '../lib/analyse/tier';
import type { Analysis, ContractValue } from '../lib/analyse/types';
import { saveAnalysis } from '../lib/library/actions';
import { formatSavedDate } from '../lib/library/logic';
import { AnalysisPanel } from './analysis-panel';
import { AnalysisView } from './analysis-view';
import { QuestionBox } from './question-box';

export type StoredProps = {
  documentId: string;
  title: string;
  text: string;
  savedAt: string | null;
  stored: { analysis: Analysis; contractValue?: ContractValue; createdAt: string | null } | null;
  withheld: boolean;
};

/**
 * A document reopened from the library. The stored analysis renders from data alone: nothing here
 * calls the model on open. A new run happens only after the signer asks for one.
 */
export function StoredDocument({ documentId, title, text, savedAt, stored, withheld }: StoredProps) {
  const [value, setValue] = useState<ContractValue | undefined>(stored?.contractValue);
  const [rerun, setRerun] = useState(false);
  const [note, setNote] = useState('');

  return (
    <div className="intake on-light">
      <p className="auth-kicker"><a href="/app/library">Library</a></p>
      <h1 className="auth-title">{title}</h1>
      {savedAt ? <p className="auth-body">Saved {formatSavedDate(savedAt)}.</p> : null}

      <section className="intake-step" aria-labelledby="stored-analysis-h">
        <h2 id="stored-analysis-h" className="intake-h">Analysis</h2>
        {stored ? (
          <>
            <p className="auth-body">
              Saved analysis{stored.createdAt ? ` from ${formatSavedDate(stored.createdAt)}` : ''}. Redline did not run the model to show it.
            </p>
            <AnalysisView
              analysis={retier(stored.analysis, value)}
              onContractValue={(v) => {
                setValue(v ?? undefined);
                setNote('');
                void saveAnalysis(documentId, stored.analysis, v ?? undefined).then((r) => {
                  if (r.status === 'refused' || r.status === 'error') setNote(r.message);
                });
              }}
            />
            {note ? <p className="auth-error" role="alert">{note}</p> : null}
          </>
        ) : withheld ? (
          <p className="auth-error" role="alert">
            The saved analysis for this document is not shown because one of its quotations does not match the
            stored text. Run the analysis again to get a new one.
          </p>
        ) : (
          <p className="auth-body">This document has not been analysed yet.</p>
        )}

        {rerun || !stored ? (
          <AnalysisPanel text={text} documentId={documentId} />
        ) : (
          <button type="button" className="intake-secondary" onClick={() => setRerun(true)}>Run analysis again</button>
        )}
        {stored && !rerun ? <QuestionBox text={text} /> : null}
      </section>

      <section className="intake-step" aria-labelledby="stored-text-h">
        <h2 id="stored-text-h" className="intake-h">Stored text</h2>
        <pre className="intake-text" tabIndex={0} aria-label="Stored agreement text">{text}</pre>
      </section>
    </div>
  );
}
