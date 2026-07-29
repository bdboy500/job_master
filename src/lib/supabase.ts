import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: SupabaseClient | null = null;

/**
 * Lazily retrieves or initializes the Supabase client.
 * Configured directly with the user's project credentials.
 */
export function getSupabase(): SupabaseClient {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  // Get env vars or set clean fallbacks
  let rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://cqwssqcpxrwkivrrmuou.supabase.co";
  const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_LmhA6lMdI1LwZ4SnCaiPMg_0Fu5Saze";

  // Clean and sanitize the base URL safely using regex
  const supabaseUrl = rawUrl.trim().replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
  const supabaseAnonKey = rawKey.trim();

  // Create client
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseInstance;
}