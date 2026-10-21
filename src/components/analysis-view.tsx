'use client';

import { useState } from 'react';
import { orderFlags } from '../lib/analyse/order';
import type { Analysis, Flag } from '../lib/analyse/types';

const SEVERITY_LABEL = { critical: 'Critical', serious: 'Serious', minor: 'Minor' } as const;

export function NotLegalAdvice() {
  return <p className="result-notice">Redline is not legal advice.</p>;
}

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 2200);
    } catch {
      // Clipboard can be blocked; the text stays selectable on screen.
    }
  }
  return (
    <button type="button" className="copy-button" onClick={() => void copy()}>
      {done ? 'Copied' : 'Copy counter-offer'}
    </button>
  );
}

function Quotation({ text }: { text: string }) {
  return (
    <figure className="from-doc">
      <figcaption className="block-label">From the document</figcaption>
      <blockquote className="quote">{text}</blockquote>
    </figure>
  );
}

function Reading({ flag }: { flag: Flag }) {
  return (
    <div className="reading">
      <p className="block-label">Redline&rsquo;s reading</p>
      <p className="reading-claim">{flag.claim}</p>
      <p className="reading-range">
        If used: from {flag.consequence.low} to {flag.consequence.high}. Basis: {flag.consequence.basis}
      </p>
      {flag.triggeredByRedLine ? <p className="reading-range">Raised by your red line: {flag.triggeredByRedLine}</p> : null}
    </div>
  );
}

function RiskFlag({ flag, n }: { flag: Flag; n: number }) {
  const sev = flag.severity ?? 'serious';
  return (
    <li className="flag-item" id={`flag-${n}`}>
      <h3 className="flag-head">
        <span className="flag-no">No. {n}</span>
        <span className={`stamp-label stamp-label--${sev}`}>{SEVERITY_LABEL[sev]}</span>
        <span className="flag-type">{flag.clauseType.replace(/-/g, ' ')}</span>
      </h3>
      <Quotation text={flag.sourceSentence} />
      <Reading flag={flag} />
      <div className="counter">
        <p className="block-label">Ask for instead</p>
        <p className="counter-text">{flag.counterOffer}</p>
        <CopyButton text={flag.counterOffer} />
      </div>
    </li>
  );
}

export function AnalysisView({ analysis }: { analysis: Analysis }) {
  const { ranked, confidentiality } = orderFlags(analysis.flags);
  const dropped = analysis.dropped.filter((d) => d.kind !== 'payload').length;
  return (
    <div className="result">
      <NotLegalAdvice />
      <section aria-labelledby="sum-h" className="result-block">
        <h2 id="sum-h" className="intake-h">What this agreement does</h2>
        {analysis.summary ? <p className="auth-body">{analysis.summary}</p> : null}
      </section>

      {dropped > 0 ? (
        <p className="intake-note" role="status">
          {dropped} {dropped === 1 ? 'item' : 'items'} in the model&rsquo;s answer left out: Redline could not find
          the quoted sentence in your document, so it does not show them.
        </p>
      ) : null}

      <section aria-labelledby="flags-h" className="result-block">
        <h2 id="flags-h" className="intake-h">Flags, most severe first</h2>
        {ranked.length > 0 ? (
          <ol className="flag-list">
            {ranked.map((f, i) => <RiskFlag key={f.id} flag={f} n={i + 1} />)}
          </ol>
        ) : (
          <p className="auth-body">No clause in this document was flagged. The cleared list below shows what was checked.</p>
        )}
      </section>

      {confidentiality.length > 0 ? (
        <section aria-labelledby="conf-h" className="result-block">
          <h2 id="conf-h" className="intake-h">This document&rsquo;s own confidentiality clause</h2>
          <p className="auth-body">
            Sending this text to Redline for analysis may breach it. Read the clause before you rely on this analysis.
          </p>
          <ul className="flag-list">
            {confidentiality.map((f) => (
              <li key={f.id} className="flag-item">
                <Quotation text={f.sourceSentence} />
                <Reading flag={f} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="clear-h" className="result-block">
        <h2 id="clear-h" className="intake-h">Checked and found acceptable</h2>
        {analysis.cleared.length > 0 ? (
          <ul className="flag-list">
            {analysis.cleared.map((c, i) => (
              <li key={`${c.clauseType}-${i}`} className="flag-item">
                <h3 className="flag-head"><span className="flag-type">{c.clauseType.replace(/-/g, ' ')}</span></h3>
                <Quotation text={c.sourceSentence} />
                <div className="reading">
                  <p className="block-label">Redline&rsquo;s reading</p>
                  <p className="reading-claim">{c.finding}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="auth-body">Nothing was cleared.</p>
        )}
      </section>
    </div>
  );
}
