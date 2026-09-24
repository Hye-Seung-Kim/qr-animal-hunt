import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Fails fast and loudly in dev rather than silently no-op-ing every
  // multiplayer call, which is much harder to debug.
  // eslint-disable-next-line no-console
  console.error("Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY env vars.");
}

export const supabase = createClient(url, anonKey);
