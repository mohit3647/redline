import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NeedsSetup } from '../../../../../src/components/needs-setup';
import { StoredDocument } from '../../../../../src/components/stored-document';
import { isDocumentId } from '../../../../../src/lib/library/logic';
import { loadStoredDocument } from '../../../../../src/lib/library/queries';
import { isSupabaseConfigured } from '../../../../../src/lib/supabase/config';

export const metadata: Metadata = { title: 'Saved agreement - Redline' };
export const dynamic = 'force-dynamic';

export default async function StoredDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isDocumentId(id)) notFound();
  if (!isSupabaseConfigured()) return <NeedsSetup />;
  const doc = await loadStoredDocument(id);
  if (doc.status === 'not-found') notFound();
  if (doc.status === 'error') {
    return (
      <section className="intake on-light">
        <p className="auth-error" role="alert">This document could not be loaded. Reload the page to try again.</p>
      </section>
    );
  }
  return (
    <StoredDocument
      documentId={doc.id}
      title={doc.title}
      text={doc.text}
      savedAt={doc.createdAt}
      stored={doc.stored}
      withheld={doc.withheld}
    />
  );
}
