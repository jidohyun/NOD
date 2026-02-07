"use client";

import { createClient } from "@/lib/supabase/client";

export type OAuthProviderId = "google";

export function getSupabase() {
  return createClient();
}

export async function signInWithGoogle(redirectTo?: string) {
  const supabase = createClient();
  const callbackUrl = redirectTo
    ? `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(redirectTo)}`
    : `${window.location.origin}/api/auth/callback`;

  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl,
    },
  });
}

export async function signOut() {
  const supabase = createClient();
  return supabase.auth.signOut();
}

export function onAuthStateChange(callback: (event: string, session: unknown) => void) {
  const supabase = createClient();
  return supabase.auth.onAuthStateChange(callback);
}
