import type { Metadata } from 'next';
import { NeedsSetup } from '../../../../src/components/needs-setup';
import { formatSavedDate } from '../../../../src/lib/library/logic';
import { listLibrary } from '../../../../src/lib/library/queries';
import { isSupabaseConfigured } from '../../../../src/lib/supabase/config';

export const metadata: Metadata = { title: 'Your library - Redline' };
export const dynamic = 'force-dynamic';

export default async function LibraryPage() {
  if (!isSupabaseConfigured()) return <NeedsSetup />;
  const list = await listLibrary();
  return (
    <section className="intake on-light" aria-labelledby="library-title">
      <h1 id="library-title" className="auth-title">Your library</h1>
      {list.status === 'error' ? (
        <p className="auth-error" role="alert">Your library could not be loaded. Reload the page to try again.</p>
      ) : list.entries.length === 0 ? (
        <p className="auth-body">Nothing saved yet. <a href="/app/new">Add an agreement</a> and it will appear here.</p>
      ) : (
        <ul className="library-list">
          {list.entries.map((e) => (
            <li key={e.id} className="library-item">
              <a className="library-title" href={`/app/library/${e.id}`}>{e.title}</a>
              <span className="library-meta">
                {e.createdAt ? `Saved ${formatSavedDate(e.createdAt)}. ` : ''}
                {e.analysed
                  ? `${e.flagCount ?? 0} ${e.flagCount === 1 ? 'flag' : 'flags'}.`
                  : 'Not analysed yet.'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
