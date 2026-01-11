"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/components/LanguageContext";
import { copy } from "@/lib/i18n";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function Navbar() {
  const [isAuthed, setIsAuthed] = useState(false);
  const { language, setLanguage } = useLanguage();
  const c = copy[language];

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      const supabase = getSupabaseClient();
      if (!supabase) {
        return;
      }
      const { data } = await supabase.auth.getSession();
      if (!isMounted) {
        return;
      }
      setIsAuthed(Boolean(data.session));
    };
    init();
    const supabase = getSupabaseClient();
    if (!supabase) {
      return;
    }
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setIsAuthed(Boolean(session));
      },
    );
    return () => {
      isMounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return;
    }
    await supabase.auth.signOut({ scope: "local" });
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-black/10 bg-[#fff7ea]/90 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <a
          href="/"
          className="text-sm font-semibold uppercase tracking-[0.3em] text-black/70"
        >
          {c.appName}
        </a>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setLanguage(language === "en" ? "es" : "en")}
            className="rounded-full border border-black/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-black/50"
          >
            {language === "en" ? "ES" : "EN"}
          </button>
          {isAuthed && (
            <div className="flex items-center gap-4">
              <a
                href="/review"
                className="text-xs font-semibold uppercase tracking-[0.3em] text-black/50"
              >
                {c.nav.review}
              </a>
              <button
                type="button"
                onClick={handleSignOut}
                className="text-xs font-semibold uppercase tracking-[0.3em] text-black/50"
              >
                {c.nav.signOut}
              </button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
