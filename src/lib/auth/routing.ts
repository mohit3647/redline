export type RouteDecision = { kind: 'continue' } | { kind: 'redirect'; to: string };

export type RouteInput = {
  pathname: string;
  configured: boolean;
  signedIn: boolean;
};

export const SIGN_IN_PATH = '/sign-in';
export const APP_HOME = '/app';

function isAppPath(pathname: string): boolean {
  return pathname === APP_HOME || pathname.startsWith(`${APP_HOME}/`);
}

/**
 * What the request proxy does with a request. When Supabase is not
 * configured nothing redirects: the pages themselves show the
 * needs-setup state, so no one is bounced to a sign-in that cannot work.
 */
export function decideRoute({ pathname, configured, signedIn }: RouteInput): RouteDecision {
  if (!configured) return { kind: 'continue' };
  if (signedIn && (pathname === '/' || pathname === SIGN_IN_PATH)) {
    return { kind: 'redirect', to: APP_HOME };
  }
  if (!signedIn && isAppPath(pathname)) {
    return { kind: 'redirect', to: SIGN_IN_PATH };
  }
  return { kind: 'continue' };
}

/**
 * Where to send someone after the sign-in link is used. Only a path on
 * this site is accepted; anything else falls back to the app home, so a
 * crafted `next` parameter cannot turn the callback into an open redirect.
 */
export function sanitizeNextPath(next: string | null | undefined, fallback: string = APP_HOME): string {
  if (!next || !next.startsWith('/')) return fallback;
  if (next.startsWith('//') || next.includes('\\')) return fallback;
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(next)) return fallback;
  try {
    const base = 'http://redline.invalid';
    const url = new URL(next, base);
    if (url.origin !== base) return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}

/** True when a cookie name belongs to a Supabase auth session (including chunked ones). */
export function isSupabaseSessionCookie(name: string): boolean {
  return /^sb-.+-auth-token(\.\d+)?$/.test(name);
}
