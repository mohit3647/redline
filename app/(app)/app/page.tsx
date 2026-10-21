import type { Metadata } from 'next';
import { isSupabaseConfigured } from '../../../src/lib/supabase/config';

export const metadata: Metadata = { title: 'Your workspace - Redline' };

export default function AppHome() {
  const configured = isSupabaseConfigured();
  return (
    <section className="sheet" aria-labelledby="home-title">
      <h1 id="home-title" className="auth-title">{configured ? 'You are signed in.' : 'Your workspace'}</h1>
      <p className="auth-body">
        Start with <a href="/app/new">a new agreement</a>. Reading and ranking its clauses comes in a later step.
      </p>
      {configured ? null : (
        <p className="auth-body">Saving documents to a library needs an account setup, which this deployment does not have yet.</p>
      )}
    </section>
  );
}
