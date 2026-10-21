import { redirect } from 'next/navigation';
import { NeedsSetup } from '../../src/components/needs-setup';
import { signOut } from '../../src/lib/auth/actions';
import { SIGN_IN_PATH } from '../../src/lib/auth/routing';
import { isSupabaseConfigured } from '../../src/lib/supabase/config';
import { getUser } from '../../src/lib/supabase/server';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured()) {
    return (
      <main className="auth-main">
        <NeedsSetup />
      </main>
    );
  }
  const user = await getUser();
  if (!user) redirect(SIGN_IN_PATH);

  return (
    <div className="shell">
      <a className="skip" href="#main">Skip to content</a>
      <header className="shell-top">
        <a className="mark-word" href="/app" aria-label="Redline, your workspace">
          <span className="tag-hang"><span className="tag tag--critical"><b>Redline</b></span></span>
        </a>
        <div className="shell-user">
          <span className="shell-email">{user.email}</span>
          <form action={signOut}>
            <button type="submit" className="shell-signout">Sign out</button>
          </form>
        </div>
      </header>
      <div className="shell-body">
        <nav className="shell-nav" aria-label="Workspace">
          <ul>
            <li><a href="/app" aria-current="page">Home</a></li>
          </ul>
        </nav>
        <main id="main" className="shell-main">{children}</main>
      </div>
    </div>
  );
}
