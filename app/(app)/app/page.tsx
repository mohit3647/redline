import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Your workspace - Redline' };

export default function AppHome() {
  return (
    <section className="sheet" aria-labelledby="home-title">
      <h1 id="home-title" className="auth-title">You are signed in.</h1>
      <p className="auth-body">There is nothing here yet. Uploading an agreement comes next.</p>
    </section>
  );
}
