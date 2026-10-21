import { createBrowserClient } from '@supabase/ssr';
import { getSupabaseConfig } from './config';

/** Browser client, or null when Supabase is not configured on this deployment. */
export function createClient() {
  const config = getSupabaseConfig();
  if (!config) return null;
  return createBrowserClient(config.url, config.anonKey);
}
