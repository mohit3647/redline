import type { NextRequest } from 'next/server';
import { updateSession } from './src/lib/supabase/proxy-session';

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:woff2|svg|png|jpg|jpeg|gif|webp|txt)$).*)'],
};
