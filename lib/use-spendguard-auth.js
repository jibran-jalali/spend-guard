"use client";

import { useEffect, useMemo, useState } from "react";

import { createBrowserSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/browser";

export function useSpendGuardAuth() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!supabase) {
      setMessage("Supabase authentication is not configured for this workspace.");
      setLoading(false);
      return undefined;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) {
        return;
      }

      if (error) {
        setMessage(error.message);
      }

      setSession(data.session || null);
      setLoading(false);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) {
        return;
      }

      setSession(nextSession || null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function signIn({ email, password }) {
    if (!supabase) {
      setMessage("Supabase authentication is not configured for this workspace.");
      return { error: new Error("Supabase not configured.") };
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Signed in. SpendGuard is loading your workspace.");
    }

    return { error };
  }

  async function signUp({ email, password, fullName, businessName }) {
    if (!supabase) {
      setMessage("Supabase authentication is not configured for this workspace.");
      return { error: new Error("Supabase not configured.") };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          business_name: businessName
        }
      }
    });

    if (error) {
      setMessage(error.message);
      return { error };
    }

    if (data.session?.access_token) {
      await fetch("/api/bootstrap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.session.access_token}`
        }
      });
    }

    setMessage(
      "Account created. Check your email if confirmation is enabled, or continue into the workspace if you're already signed in."
    );
    return { error: null };
  }

  async function resetPassword(email) {
    if (!supabase) {
      setMessage("Supabase authentication is not configured for this workspace.");
      return { error: new Error("Supabase not configured.") };
    }

    const redirectTo =
      typeof window !== "undefined" ? `${window.location.origin}/` : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Password reset email sent. Check your inbox.");
    }

    return { error };
  }

  async function signOut() {
    if (supabase && session) {
      await supabase.auth.signOut();
    }

    setSession(null);
    setMessage("Signed out.");
  }

  return {
    authEnabled: isSupabaseConfigured(),
    session,
    loading,
    message,
    clearMessage: () => setMessage(null),
    mode: session ? "live" : "guest",
    userName:
      session?.user?.user_metadata?.full_name ||
      session?.user?.email ||
      "SpendGuard Admin",
    signIn,
    signUp,
    resetPassword,
    signOut
  };
}
