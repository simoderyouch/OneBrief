/**
 * lib/supabase/client.ts
 *
 * Server-side Supabase admin client.
 * Uses the SERVICE_ROLE key — full DB & Storage access.
 * NEVER import this in client components or expose to the browser.
 */
import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables."
    );
  }

  _client = createClient(url, key, {
    auth: {
      // Disable session persistence — we're on the server, not a browser
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return _client;
}

export const supabase = getSupabaseAdmin();
