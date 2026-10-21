export type SupabaseEnv = {
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
};

// Next inlines NEXT_PUBLIC_* only when they are read as literal property
// accesses, so the defaults below must stay spelled out.
function currentEnv(): SupabaseEnv {
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

function isUsableUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

/** Both variables are set, non-blank, and the URL parses as http(s). */
export function getSupabaseConfig(env: SupabaseEnv = currentEnv()): { url: string; anonKey: string } | null {
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey || !isUsableUrl(url)) return null;
  return { url, anonKey };
}

export function isSupabaseConfigured(env: SupabaseEnv = currentEnv()): boolean {
  return getSupabaseConfig(env) !== null;
}
