"use client";

import { createClient } from "@/lib/supabase/client";

export type OAuthProviderId = "google";

export function getSupabase() {
  return createClient();
}

function getAuthCallbackOrigin(): string {
  if (typeof window === "undefined") {
    return "";
  }

  const url = new URL(window.location.href);

  // Some dev setups open the app on 0.0.0.0 / 127.0.0.1 which may not be
  // allowlisted in Supabase redirect URLs. Canonicalize to localhost.
  if (url.hostname === "0.0.0.0" || url.hostname === "127.0.0.1") {
    const port = url.port ? `:${url.port}` : "";
    return `${url.protocol}//localhost${port}`;
  }

  return url.origin;
}

export async function signInWithGoogle(redirectTo?: string) {
  const supabase = createClient();
  const origin = getAuthCallbackOrigin();

  // Persist next path in a cookie so Supabase redirect URL allowlisting doesn't
  // need to account for arbitrary query params.
  if (redirectTo) {
    // biome-ignore lint/suspicious/noDocumentCookie: Used for auth redirect persistence
    document.cookie = `nod_auth_next=${encodeURIComponent(redirectTo)}; path=/; max-age=600; samesite=lax`;
  }

  const callbackUrl = `${origin}/api/auth/callback`;

  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl,
    },
  });
}

export async function signUpWithEmail(email: string, password: string, name: string) {
  const supabase = createClient();
  const origin = getAuthCallbackOrigin();
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
      emailRedirectTo: `${origin}/api/auth/callback?type=signup`,
    },
  });
}

export async function signInWithEmail(email: string, password: string) {
  const supabase = createClient();
  return supabase.auth.signInWithPassword({ email, password });
}

export async function resetPassword(email: string) {
  const supabase = createClient();
  const origin = getAuthCallbackOrigin();
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/reset-password`,
  });
}

export async function updatePassword(newPassword: string) {
  const supabase = createClient();
  return supabase.auth.updateUser({ password: newPassword });
}

export async function resendVerificationEmail(email: string) {
  const supabase = createClient();
  return supabase.auth.resend({ type: "signup", email });
}

export async function signOut() {
  const supabase = createClient();
  return supabase.auth.signOut();
}

export function onAuthStateChange(callback: (event: string, session: unknown) => void) {
  const supabase = createClient();
  return supabase.auth.onAuthStateChange(callback);
}
