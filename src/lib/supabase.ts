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

  // Get env vars or set clean fallbacks, ensuring dummy placeholders are ignored
  let rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  if (!rawUrl || rawUrl.includes("your-project") || !rawUrl.startsWith("http")) {
    rawUrl = "https://cqwssqcpxrwkivrrmuou.supabase.co";
  }

  let rawKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
  if (!rawKey || rawKey.includes("your-anon-key")) {
    rawKey = "sb_publishable_LmhA6lMdI1LwZ4SnCaiPMg_0Fu5Saze";
  }

  // Clean and sanitize the base URL safely using regex
  const supabaseUrl = rawUrl.trim().replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
  const supabaseAnonKey = rawKey.trim();

  // Create client
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseInstance;
}