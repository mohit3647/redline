import type { Metadata } from 'next';
import { RedLinesEditor } from '../../../../src/components/red-lines-editor';
import { listRedLines } from '../../../../src/lib/red-lines/actions';
import { isSupabaseConfigured } from '../../../../src/lib/supabase/config';

export const metadata: Metadata = { title: 'Your red lines - Redline' };
export const dynamic = 'force-dynamic';

export default async function RedLinesPage() {
  const configured = isSupabaseConfigured();
  const result = configured ? await listRedLines() : null;
  const initial = result?.status === 'ok' ? result.redLines : [];
  const loadError = result && result.status !== 'ok' ? 'Your saved red lines could not be loaded. Reload the page to try again.' : null;
  return <RedLinesEditor configured={configured} initial={initial} loadError={loadError} />;
}
