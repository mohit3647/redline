import type { Metadata } from 'next';
import { NeedsSetup } from '../../src/components/needs-setup';
import { SignInForm } from '../../src/components/sign-in-form';
import { isSupabaseConfigured } from '../../src/lib/supabase/config';

export const metadata: Metadata = { title: 'Sign in - Redline' };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <>
      <header className="top">
        <a className="mark-word" href="/" aria-label="Redline home">
          <span className="tag-hang"><span className="tag tag--critical"><b>Redline</b></span></span>
        </a>
      </header>
      <main className="auth-main">
        {isSupabaseConfigured() ? (
          <div className="auth-sheet on-light"><SignInForm linkError={error === 'link'} /></div>
        ) : (
          <NeedsSetup />
        )}
      </main>
    </>
  );
}
