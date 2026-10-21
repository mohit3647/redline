import { NextResponse, type NextRequest } from 'next/server';
import { SIGN_IN_PATH, sanitizeNextPath } from '../../../src/lib/auth/routing';
import { createClient } from '../../../src/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const next = sanitizeNextPath(searchParams.get('next'));

  const supabase = await createClient();
  if (!supabase || !code) {
    return NextResponse.redirect(new URL(`${SIGN_IN_PATH}?error=link`, origin));
  }
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL(`${SIGN_IN_PATH}?error=link`, origin));
  }
  return NextResponse.redirect(new URL(next, origin));
}
