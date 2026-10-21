import { redirect } from 'next/navigation';
import { ShellNav } from '../../src/components/shell-nav';
import { signOut } from '../../src/lib/auth/actions';
import { SIGN_IN_PATH } from '../../src/lib/auth/routing';
import { isSupabaseConfigured } from '../../src/lib/supabase/config';
import { getUser } from '../../src/lib/supabase/server';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Configured: the app is for signed-in signers only. Unconfigured: there is no account
  // service to sign in to, so the working shell is shown and account features say so.
  const configured = isSupabaseConfigured();
  const user = configured ? await getUser() : null;
  if (configured && !user) redirect(SIGN_IN_PATH);

  return (
    <div className="shell">
      <a className="skip" href="#main">Skip to content</a>
      <header className="shell-top">
        <a className="mark-word" href="/app" aria-label="Redline, your workspace">
          <span className="tag-hang"><span className="tag tag--critical"><b>Redline</b></span></span>
        </a>
        {user ? (
          <div className="shell-user">
            <span className="shell-email">{user.email}</span>
            <form action={signOut}>
              <button type="submit" className="shell-signout">Sign out</button>
            </form>
          </div>
        ) : (
          <div className="shell-user"><span className="shell-email">No account set up</span></div>
        )}
      </header>
      <div className="shell-body">
        <ShellNav />
        <main id="main" className="shell-main">{children}</main>
      </div>
    </div>
  );
}
