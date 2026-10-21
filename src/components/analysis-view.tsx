'use client';

import { useState } from 'react';
import { countMissingCounterOffers, hasCounterOffer } from '../lib/analyse/counts';
import { orderFlags } from '../lib/analyse/order';
import { COPIED_MESSAGE, COPY_FAILED_MESSAGE, copyText } from '../lib/copy';
import { FEE_UNKNOWN_NOTE, formatMoney, parseContractValue } from '../lib/analyse/tier';
import type { AnchorType, Analysis, ContractValue, Flag, TierBasis } from '../lib/analyse/types';

const SEVERITY_LABEL = { critical: 'Critical', serious: 'Serious', minor: 'Minor' } as const;

export function NotLegalAdvice() {
  return <p className="result-notice">Redline is not legal advice.</p>;
}

export function CopyButton({ text, copy = copyText }: { text: string; copy?: (text: string) => Promise<boolean> }) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  async function run() {
    const ok = await copy(text);
    setStatus(ok ? 'copied' : 'failed');
    setTimeout(() => setStatus('idle'), 3000);
  }
  return (
    <>
      <button type="button" className="copy-button" onClick={() => void run()}>
        Copy counter-offer
      </button>
      <span className="copy-status" role="status" aria-live="polite">
        {status === 'copied' ? COPIED_MESSAGE : status === 'failed' ? COPY_FAILED_MESSAGE : ''}
      </span>
    </>
  );
}

function CounterOffer({ flag }: { flag: Flag }) {
  return (
    <div className="counter">
      <p className="block-label">Ask for instead</p>
      {hasCounterOffer(flag) ? (
        <>
          <p className="counter-text">{flag.counterOffer}</p>
          <CopyButton text={flag.counterOffer} />
        </>
      ) : (
        <p className="counter-text counter-text--none">No counter-offer drafted</p>
      )}
    </div>
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

const BASIS_TEXT: Record<Exclude<TierBasis, 'fee-unknown'>, string> = {
  unboundedness: 'Tier set by the clause itself: it has no limit that relates to the fee.',
  definition: 'Tier set by the clause type: a cap below the contract value is serious whatever the fee.',
  'fee-extracted': 'Tier set against the fee the document states.',
  'fee-supplied': 'Tier set against the contract value you entered.',
};

function TierLine({ flag }: { flag: Flag }) {
  if (!flag.tierBasis) return null;
  if (flag.tierBasis === 'fee-unknown') return <p className="reading-range tier-line">{FEE_UNKNOWN_NOTE}</p>;
  return (
    <p className="reading-range tier-line">
      {BASIS_TEXT[flag.tierBasis]}
      {flag.tierNote ? ` ${flag.tierNote}` : ''}
    </p>
  );
}

function RiskFlag({ flag, n }: { flag: Flag; n: number }) {
  const sev = flag.severity;
  return (
    <li className="flag-item" id={`flag-${n}`}>
      <h3 className="flag-head">
        <span className="flag-no">No. {n}</span>
        {sev ? (
          <span className={`stamp-label stamp-label--${sev}`}>{SEVERITY_LABEL[sev]}</span>
        ) : (
          <span className="stamp-label stamp-label--undecided">Serious or minor</span>
        )}
        <span className="flag-type">{flag.clauseType.replace(/-/g, ' ')}</span>
      </h3>
      <Quotation text={flag.sourceSentence} />
      <Reading flag={flag} />
      <TierLine flag={flag} />
      <CounterOffer flag={flag} />
    </li>
  );
}

const ANCHOR_LABEL: Record<AnchorType, string> = {
  'uncapped-indemnity': 'uncapped indemnity',
  'ip-assignment': 'IP assignment',
  'termination-for-convenience': 'termination for convenience',
};

function ClearedList({ analysis }: { analysis: Analysis }) {
  const noFlags = analysis.flags.length === 0;
  return (
    <section aria-labelledby="clear-h" className={`result-block cleared-block${noFlags ? ' cleared-block--lead' : ''}`}>
      <h2 id="clear-h" className="intake-h">Cleared list</h2>
      <p className="auth-body">This is what Redline checked and found acceptable, with the sentence each entry rests on.</p>
      {analysis.cleared.length > 0 ? (
        <ul className="flag-list">
          {analysis.cleared.map((c, i) => (
            <li key={`${c.clauseType}-${i}`} className="flag-item cleared-item">
              <h3 className="flag-head">
                <span className="stamp-label stamp-label--cleared">Cleared</span>
                <span className="flag-type">{c.clauseType.replace(/-/g, ' ')}</span>
              </h3>
              <Quotation text={c.sourceSentence} />
              <div className="reading">
                <p className="block-label">Redline&rsquo;s reading</p>
                <p className="reading-claim">{c.finding}</p>
                {c.note ? <p className="reading-range">{c.note}</p> : null}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="auth-body">Nothing was cleared.</p>
      )}
      {analysis.absent.length > 0 ? (
        <div className="absent-note">
          <p className="reading-claim">
            <span className="stamp-label stamp-label--absent">Absent</span>{' '}
            No clause found for: {analysis.absent.map((a) => ANCHOR_LABEL[a]).join(', ')}.
          </p>
          <p className="reading-range">
            This is stated from the text Redline read. It has no sentence to quote, because nothing was found to quote.
          </p>
        </div>
      ) : null}
    </section>
  );
}

function FeeForm({ analysis, onContractValue }: { analysis: Analysis; onContractValue: (v: ContractValue | null) => void }) {
  const current = analysis.fee.state === 'unknown' ? undefined : analysis.fee;
  const [amount, setAmount] = useState(analysis.fee.state === 'supplied' ? String(analysis.fee.amount) : '');
  const [currency, setCurrency] = useState(current?.currency ?? 'USD');
  const [error, setError] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseContractValue(amount, currency);
    if (!parsed.ok) {
      setError(parsed.message);
      return;
    }
    setError('');
    onContractValue(parsed.value);
  }

  return (
    <form className="fee-form" onSubmit={submit} noValidate>
      <label className="auth-label" htmlFor="fee-amount">
        {analysis.fee.state === 'unknown' ? 'Contract value' : 'Change the contract value'}
      </label>
      <div className="fee-row">
        <input
          id="fee-amount"
          className="auth-input fee-amount"
          inputMode="decimal"
          autoComplete="off"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'fee-error' : undefined}
        />
        <label className="visually-hidden" htmlFor="fee-currency">Currency code</label>
        <input
          id="fee-currency"
          className="auth-input fee-currency"
          maxLength={3}
          autoComplete="off"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          aria-invalid={error ? true : undefined}
        />
        <button type="submit" className="auth-button">Re-tier with this value</button>
        {analysis.fee.state === 'supplied' ? (
          <button
            type="button"
            className="copy-button"
            onClick={() => {
              setAmount('');
              setError('');
              onContractValue(null);
            }}
          >
            Remove my value
          </button>
        ) : null}
      </div>
      {error ? <p id="fee-error" className="auth-error" role="alert">{error}</p> : null}
    </form>
  );
}

function FeePanel({ analysis, onContractValue }: { analysis: Analysis; onContractValue?: (v: ContractValue | null) => void }) {
  const { fee, extractedFee } = analysis;
  return (
    <section aria-labelledby="fee-h" className="result-block fee-block">
      <h2 id="fee-h" className="intake-h">The fee behind the tiers</h2>
      {fee.state === 'extracted' ? (
        <>
          <p className="auth-body">
            <span className="stamp-label stamp-label--cleared">From the document</span>{' '}
            Fee: {formatMoney(fee.amount, fee.currency)}. Serious and Minor are split against it.
          </p>
          <Quotation text={fee.sourceSentence} />
        </>
      ) : null}
      {fee.state === 'supplied' ? (
        <>
          <p className="auth-body">
            <span className="stamp-label stamp-label--cleared">Entered by you</span>{' '}
            Contract value: {formatMoney(fee.amount, fee.currency)}. Serious and Minor are split against it.
          </p>
          {extractedFee ? (
            <>
              <p className="reading-range">
                The document states a fee of {formatMoney(extractedFee.amount, extractedFee.currency)}. Your value is used instead.
              </p>
              <Quotation text={extractedFee.sourceSentence} />
            </>
          ) : null}
        </>
      ) : null}
      {fee.state === 'unknown' ? (
        <p className="auth-body">
          <span className="stamp-label stamp-label--undecided">Fee unknown</span> {FEE_UNKNOWN_NOTE}
        </p>
      ) : null}
      {onContractValue ? <FeeForm key={`${fee.state}-${'amount' in fee ? fee.amount : 0}`} analysis={analysis} onContractValue={onContractValue} /> : null}
    </section>
  );
}

export function AnalysisView({
  analysis,
  onContractValue,
}: {
  analysis: Analysis;
  /** Called with the signer's value, or null to remove it. The parent re-tiers locally. */
  onContractValue?: (v: ContractValue | null) => void;
}) {
  const { ranked, confidentiality } = orderFlags(analysis.flags);
  const missingCounterOffers = countMissingCounterOffers(analysis);
  const dropped = analysis.dropped.filter((d) => d.kind !== 'payload' && d.kind !== 'absent' && d.kind !== 'summary').length;
  return (
    <div className="result">
      <NotLegalAdvice />
      <section aria-labelledby="sum-h" className="result-block">
        <h2 id="sum-h" className="intake-h">What this agreement does</h2>
        {analysis.summary.trim() ? (
          <p className="auth-body">{analysis.summary}</p>
        ) : (
          <p className="auth-body" role="status">
            <span className="stamp-label stamp-label--undecided">Summary unavailable</span> The analysis came back without a
            summary. The flags and the cleared list below do not depend on it.
          </p>
        )}
      </section>

      <FeePanel analysis={analysis} onContractValue={onContractValue} />

      {dropped > 0 ? (
        <p className="intake-note" role="status">
          {dropped} {dropped === 1 ? 'item' : 'items'} in the model&rsquo;s answer left out: Redline could not find
          the quoted sentence in your document, so it does not show them.
        </p>
      ) : null}

      {missingCounterOffers > 0 ? (
        <p className="intake-note" role="status">
          {missingCounterOffers} {missingCounterOffers === 1 ? 'flag has' : 'flags have'} no counter-offer drafted.
        </p>
      ) : null}

      <section aria-labelledby="flags-h" className="result-block">
        <h2 id="flags-h" className="intake-h">Flags, most severe first</h2>
        {ranked.length > 0 ? (
          <ol className="flag-list">
            {ranked.map((f, i) => <RiskFlag key={f.id} flag={f} n={i + 1} />)}
          </ol>
        ) : (
          <p className="auth-body">No clause in this document was flagged. The cleared list below is what Redline checked and found acceptable.</p>
        )}
      </section>

      {confidentiality.length > 0 ? (
        <section aria-labelledby="conf-h" className="result-block">
          <h2 id="conf-h" className="intake-h">
            <span className="stamp-label stamp-label--notice">Disclosure notice</span> This document&rsquo;s own confidentiality clause
          </h2>
          <p className="auth-body">
            Redline sent the text of this document to a third-party model provider to produce this analysis. This clause
            restricts disclosing the document, so uploading it may breach the clause. This is not a severity and does not count as a flag.
          </p>
          <ul className="flag-list">
            {confidentiality.map((f) => (
              <li key={f.id} className="flag-item">
                <Quotation text={f.sourceSentence} />
                <Reading flag={f} />
                <CounterOffer flag={f} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <ClearedList analysis={analysis} />
    </div>
  );
}
