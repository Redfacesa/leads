import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/env";

let client: SupabaseClient | null = null;

export function createClient(): SupabaseClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!isSupabaseConfigured() || !url || !key) {
    throw new Error("RedFace Connect is not configured yet. Set Supabase environment variables in Vercel.");
  }

  client = createBrowserClient(url, key);
  return client;
}

export function tryCreateClient(): SupabaseClient | null {
  try {
    return createClient();
  } catch {
    return null;
  }
}
