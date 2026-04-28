"use client";

import { createClient } from "@supabase/supabase-js";

let browserClient = null;

function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL;
}

function getSupabasePublishableKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

function getSupabaseProjectRef() {
  try {
    return new URL(getSupabaseUrl()).hostname.split(".")[0];
  } catch (error) {
    return null;
  }
}

export function isSupabaseConfigured() {
  return Boolean(getSupabaseUrl() && getSupabasePublishableKey());
}

export function clearBrowserSupabaseSession() {
  if (typeof window === "undefined") {
    return;
  }

  const projectRef = getSupabaseProjectRef();
  const keys = [
    projectRef ? `sb-${projectRef}-auth-token` : null,
    "supabase.auth.token"
  ].filter(Boolean);

  for (const key of keys) {
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  }
}

export function createBrowserSupabaseClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!browserClient) {
    browserClient = createClient(
      getSupabaseUrl(),
      getSupabasePublishableKey(),
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      }
    );
  }

  return browserClient;
}
