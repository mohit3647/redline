'use client';

import { useEffect, useState } from 'react';
import { addRedLine, removeRedLine, updateRedLine, type SavedRedLine, type WriteResult } from '../lib/red-lines/actions';
import { checkRedLineText, DEFAULT_RED_LINES, MAX_RED_LINE_CHARS, MAX_RED_LINES } from '../lib/red-lines/rules';
import { readSessionRedLines, writeSessionRedLines } from '../lib/red-lines/session-store';

export function RedLinesEditor({ configured, initial, loadError }: { configured: boolean; initial: SavedRedLine[]; loadError: string | null }) {
  const [list, setList] = useState<SavedRedLine[]>(initial);
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null);
  const [error, setError] = useState<string | null>(loadError);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!configured) setList(readSessionRedLines());
  }, [configured]);

  const full = list.length >= MAX_RED_LINES;

  function commitLocal(next: SavedRedLine[]) {
    setList(next);
    writeSessionRedLines(next);
  }

  function applyRemote(r: WriteResult): boolean {
    if (r.status === 'ok') {
      setList(r.redLines);
      setError(null);
      return true;
    }
    if (r.status === 'signed-out') setError('You are signed out. Sign in again to change your red lines.');
    else if (r.status === 'unconfigured') setError('No account service is connected, so nothing was saved.');
    else setError(r.message);
    return false;
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const check = checkRedLineText(draft);
    if (!check.ok) return setError(check.message);
    if (full) return setError(`You can keep at most ${MAX_RED_LINES} red lines. Remove one to add another.`);
    if (!configured) {
      commitLocal([...list, { id: crypto.randomUUID(), text: check.text }]);
      setDraft('');
      return setError(null);
    }
    setBusy(true);
    if (applyRemote(await addRedLine(check.text))) setDraft('');
    setBusy(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const check = checkRedLineText(editing.text);
    if (!check.ok) return setError(check.message);
    if (!configured) {
      commitLocal(list.map((r) => (r.id === editing.id ? { ...r, text: check.text } : r)));
      setEditing(null);
      return setError(null);
    }
    setBusy(true);
    if (applyRemote(await updateRedLine(editing.id, check.text))) setEditing(null);
    setBusy(false);
  }

  async function remove(id: string) {
    if (!configured) {
      commitLocal(list.filter((r) => r.id !== id));
      return setError(null);
    }
    setBusy(true);
    applyRemote(await removeRedLine(id));
    setBusy(false);
  }

  return (
    <div className="intake">
      <section aria-labelledby="rl-title">
        <h1 id="rl-title" className="auth-title">Your red lines</h1>
        <p className="auth-body">
          A red line is a term you will not accept in any agreement. Redline checks each agreement against yours as well as its own
          defaults. A clause that breaks one is flagged even if the defaults would clear it, and the flag says your red line is why.
          A red line can raise a tier. It never lowers one.
        </p>
        {configured ? (
          <p className="auth-body">Saved to your account. Only you can see them.</p>
        ) : (
          <p className="auth-body" role="note">
            <strong>Not saved.</strong> No account service is connected to this deployment, so these red lines are kept in this browser tab only and
            are gone when you close it. Saving them to an account needs account setup.
          </p>
        )}
      </section>

      <section className="intake-step" aria-labelledby="mine-h">
        <h2 id="mine-h" className="intake-h">Yours</h2>
        {list.length === 0 ? (
          <p className="auth-body">You have no red lines yet. Without any, Redline uses its defaults alone.</p>
        ) : (
          <ul className="redline-list">
            {list.map((r) => (
              <li key={r.id} className="redline-item">
                {editing?.id === r.id ? (
                  <form onSubmit={save} noValidate>
                    <label className="auth-label" htmlFor={`edit-${r.id}`}>Edit red line</label>
                    <textarea
                      id={`edit-${r.id}`}
                      className="auth-input"
                      rows={3}
                      maxLength={MAX_RED_LINE_CHARS + 100}
                      value={editing.text}
                      onChange={(e) => setEditing({ id: r.id, text: e.target.value })}
                    />
                    <div className="redline-actions">
                      <button type="submit" className="auth-button" disabled={busy}>Save change</button>
                      <button type="button" className="redline-link" onClick={() => { setEditing(null); setError(null); }}>Cancel</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <p className="redline-text">{r.text}</p>
                    <div className="redline-actions">
                      <button type="button" className="redline-link" onClick={() => { setEditing({ id: r.id, text: r.text }); setError(null); }}>
                        Edit<span className="sr-only"> red line: {r.text}</span>
                      </button>
                      <button type="button" className="redline-link" disabled={busy} onClick={() => void remove(r.id)}>
                        Remove<span className="sr-only"> red line: {r.text}</span>
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={add} noValidate>
          <label className="auth-label" htmlFor="new-red-line">Add a red line</label>
          <textarea
            id="new-red-line"
            className="auth-input"
            rows={3}
            placeholder="I never assign IP I created before the engagement"
            maxLength={MAX_RED_LINE_CHARS + 100}
            value={draft}
            disabled={full}
            aria-describedby="rl-hint"
            onChange={(e) => setDraft(e.target.value)}
          />
          <p id="rl-hint" className="auth-body">
            {list.length} of {MAX_RED_LINES} used. Up to {MAX_RED_LINE_CHARS} characters each.
          </p>
          {error ? <p className="auth-error" role="alert">{error}</p> : null}
          <button type="submit" className="auth-button" disabled={busy || full}>Add red line</button>
        </form>
      </section>

      <section className="intake-step" aria-labelledby="defaults-h">
        <h2 id="defaults-h" className="intake-h">Redline&rsquo;s defaults</h2>
        <p className="auth-body">These always apply. They are Redline&rsquo;s, not yours, and you cannot edit them.</p>
        <ul className="redline-list redline-list--defaults">
          {DEFAULT_RED_LINES.map((d) => (
            <li key={d.id} className="redline-item"><p className="redline-text">{d.text}</p></li>
          ))}
        </ul>
      </section>
    </div>
  );
}
