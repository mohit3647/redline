import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { decideRoute, isSupabaseSessionCookie } from '../auth/routing';
import { getSupabaseConfig } from './config';

/**
 * Request-proxy step: refresh the Supabase session cookies and apply the
 * redirect rules. A no-op when Supabase is not configured. Requests with no
 * session cookie skip the auth-server round trip.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const config = getSupabaseConfig();
  const pathname = request.nextUrl.pathname;
  if (!config) return NextResponse.next({ request });

  const hasSession = request.cookies.getAll().some((c) => isSupabaseSessionCookie(c.name));
  let response = NextResponse.next({ request });
  let signedIn = false;

  if (hasSession) {
    const supabase = createServerClient(config.url, config.anonKey, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });
    try {
      const { data } = await supabase.auth.getUser();
      signedIn = Boolean(data.user);
    } catch {
      signedIn = false;
    }
  }

  const decision = decideRoute({ pathname, configured: true, signedIn });
  if (decision.kind === 'redirect') {
    const redirect = NextResponse.redirect(new URL(decision.to, request.url));
    // Carry any refreshed (or cleared) session cookies onto the redirect.
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }
  return response;
}
