"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useLanguage } from "@/components/LanguageContext";
import { copy } from "@/lib/i18n";
import { AuthProvider } from "@/components/AuthContext";

type AuthGateProps = {
  children: React.ReactNode;
};

export default function AuthGate({ children }: AuthGateProps) {
  const [session, setSession] = useState<null | { userId: string }>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mode, setMode] = useState<
    "signIn" | "signUp" | "reset" | "updatePassword"
  >("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { language } = useLanguage();
  const c = copy[language];

  const isModalVisible = useMemo(() => !session, [session]);

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      const supabase = getSupabaseClient();
      if (!supabase) {
        setError(c.auth.supabaseMissing);
        setIsLoading(false);
        return;
      }
      const { data } = await supabase.auth.getSession();
      if (!isMounted) {
        return;
      }
      setSession(data.session ? { userId: data.session.user.id } : null);
      setIsLoading(false);
    };
    init();
    const supabase = getSupabaseClient();
    if (!supabase) {
      return;
    }
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (event, nextSession) => {
        setSession(nextSession ? { userId: nextSession.user.id } : null);
        if (event === "PASSWORD_RECOVERY") {
          setMode("updatePassword");
        }
      },
    );
    return () => {
      isMounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (window.location.hash.includes("type=recovery")) {
      setMode("updatePassword");
    }
  }, []);

  const handleEmailAuth = async () => {
    setError(null);
    setMessage(null);
    setIsSubmitting(true);
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error("Supabase is not configured.");
      }
      if (mode === "signIn") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) {
          throw signInError;
        }
      } else if (mode === "signUp") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) {
          throw signUpError;
        }
      } else if (mode === "reset") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
          email,
          {
            redirectTo: `${window.location.origin}/?reset=1`,
          },
        );
        if (resetError) {
          throw resetError;
        }
        setMessage(c.auth.resetSent);
      } else if (mode === "updatePassword") {
        if (password.length < 6) {
          throw new Error(c.auth.passwordTooShort);
        }
        if (password !== confirmPassword) {
          throw new Error(c.auth.passwordMismatch);
        }
        const { error: updateError } = await supabase.auth.updateUser({
          password,
        });
        if (updateError) {
          throw updateError;
        }
        setMessage(c.auth.passwordUpdated);
        setMode("signIn");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : c.auth.supabaseMissing,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="px-4 py-10 text-sm text-black/60">{c.auth.loading}</div>
    );
  }

  return (
    <AuthProvider value={{ isAuthenticated: Boolean(session) }}>
      {children}
      {isModalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-10">
          <div className="w-full max-w-md space-y-5 rounded-3xl border border-black/10 bg-white p-6 shadow-[0_30px_80px_-60px_rgba(0,0,0,0.6)]">
            <div className="space-y-2 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/40">
                {c.appName}
              </p>
              <h2 className="text-2xl font-semibold">
                {mode === "signIn"
                  ? c.auth.headlineSignIn
                  : mode === "signUp"
                    ? c.auth.headlineSignUp
                    : mode === "reset"
                      ? c.auth.headlineReset
                      : c.auth.headlineUpdate}
              </h2>
              <p className="text-sm text-black/60">
                {c.auth.subtitle}
              </p>
            </div>

            <div className="space-y-3">
              <label className="flex flex-col gap-2 text-sm font-medium text-black/70">
                {c.auth.emailLabel}
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="rounded-xl border border-black/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
              </label>
              {mode !== "reset" && (
                <label className="flex flex-col gap-2 text-sm font-medium text-black/70">
                  {c.auth.passwordLabel}
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="rounded-xl border border-black/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  />
                </label>
              )}
              {mode === "updatePassword" && (
                <label className="flex flex-col gap-2 text-sm font-medium text-black/70">
                  {c.auth.confirmPasswordLabel}
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="rounded-xl border border-black/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  />
                </label>
              )}
              {error && (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
                  {error}
                </p>
              )}
              {message && (
                <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                  {message}
                </p>
              )}
              <button
                type="button"
                onClick={handleEmailAuth}
                disabled={isSubmitting}
                className="w-full rounded-full bg-[var(--primary)] px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {mode === "signIn"
                  ? c.auth.signIn
                  : mode === "signUp"
                    ? c.auth.signUp
                    : mode === "reset"
                      ? c.auth.sendReset
                      : c.auth.updatePassword}
              </button>
            </div>

            <button
              type="button"
              className="w-full text-xs font-semibold uppercase tracking-[0.3em] text-black/40"
              onClick={() => {
                setError(null);
                setMessage(null);
                setMode((prev) =>
                  prev === "signIn" ? "signUp" : "signIn",
                );
              }}
            >
              {mode === "signIn"
                ? c.auth.toggleToSignUp
                : c.auth.toggleToSignIn}
            </button>
            {mode !== "updatePassword" && (
              <button
                type="button"
                className="w-full text-xs font-semibold uppercase tracking-[0.3em] text-black/30"
                onClick={() => {
                  setError(null);
                  setMessage(null);
                  setMode("reset");
                }}
              >
                {c.auth.forgotPassword}
              </button>
            )}
          </div>
        </div>
      )}
    </AuthProvider>
  );
}
