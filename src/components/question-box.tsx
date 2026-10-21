'use client';

import { useState } from 'react';
import type { Answer } from '../lib/ask/types';
import { Quotation } from './analysis-view';

const MAX_QUESTION = 1000;
export const NOT_IN_DOCUMENT = 'The document does not say.';

type State = { s: 'idle' } | { s: 'asking' } | { s: 'done'; answer: Answer };

/** Renders one answer. A cited answer always shows its sentences as quotations; nothing else is shown as cited. */
export function AnswerView({ answer }: { answer: Answer }) {
  if (answer.kind === 'failed') {
    return <p className="auth-error" role="alert">{answer.message}</p>;
  }
  if (answer.kind === 'not-in-document') {
    return (
      <div className="answer">
        <p className="reading-claim">{NOT_IN_DOCUMENT}</p>
        {answer.note ? <p className="reading-range">{answer.note}</p> : null}
      </div>
    );
  }
  const dropped = answer.dropped.length;
  return (
    <div className="answer">
      <div className="reading">
        <p className="block-label">Redline&rsquo;s reading</p>
        <p className="reading-claim">{answer.answer}</p>
      </div>
      {answer.sourceSentences.map((s, i) => <Quotation key={i} text={s} />)}
      {dropped > 0 ? (
        <p className="reading-range">
          {dropped} cited {dropped === 1 ? 'sentence' : 'sentences'} could not be found in your document and {dropped === 1 ? 'is' : 'are'} not shown.
        </p>
      ) : null}
    </div>
  );
}

export function QuestionBox({ text }: { text: string }) {
  const [question, setQuestion] = useState('');
  const [state, setState] = useState<State>({ s: 'idle' });
  const [error, setError] = useState('');

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (q.length < 1 || q.length > MAX_QUESTION) {
      setError(`Write a question of 1 to ${MAX_QUESTION} characters.`);
      return;
    }
    setError('');
    setState({ s: 'asking' });
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, question: q }),
      });
      const body = (await res.json()) as Answer;
      if (body && typeof body === 'object' && 'kind' in body) setState({ s: 'done', answer: body });
      else throw new Error('unreadable');
    } catch {
      setState({
        s: 'done',
        answer: { kind: 'failed', reason: 'provider-error', message: 'Redline could not reach the question service. Nothing was answered.' },
      });
    }
  }

  return (
    <section aria-labelledby="ask-h" className="result-block question-box">
      <h2 id="ask-h" className="intake-h">Ask about this document</h2>
      <p className="auth-body">Answers come from this document&rsquo;s text only, with the sentence they rest on. Redline is not legal advice.</p>
      <form onSubmit={(e) => void ask(e)} noValidate>
        <label className="auth-label" htmlFor="ask-q">Your question</label>
        <textarea
          id="ask-q"
          className="auth-input"
          rows={3}
          maxLength={MAX_QUESTION}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'ask-error' : undefined}
        />
        {error ? <p id="ask-error" className="auth-error" role="alert">{error}</p> : null}
        <button type="submit" className="auth-button" disabled={state.s === 'asking'}>
          {state.s === 'asking' ? 'Asking' : 'Ask'}
        </button>
      </form>
      <div aria-live="polite" className="answer-region">
        {state.s === 'asking' ? <p className="auth-body">Reading the document for an answer.</p> : null}
        {state.s === 'done' ? <AnswerView answer={state.answer} /> : null}
      </div>
    </section>
  );
}
