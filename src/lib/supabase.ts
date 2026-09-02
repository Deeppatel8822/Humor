import { createClient } from "@supabase/supabase-js";

// Public client — safe for browser use, respects Row Level Security policies.
// Lazily created so the app still builds before NEXT_PUBLIC_SUPABASE_URL is set
// (e.g. local dev, or this project before Supabase is provisioned).
let _supabase: ReturnType<typeof createClient> | null = null;
export function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key"
    );
  }
  return _supabase;
}

// Server-only client — bypasses RLS. NEVER import this in a client component.
// Use only inside API routes / server actions (e.g. writing orders, moderating reviews).
export function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-role-key"
  );
}
