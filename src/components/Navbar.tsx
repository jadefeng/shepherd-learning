"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Navbar() {
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!isMounted) {
        return;
      }
      setIsAuthed(Boolean(data.session));
    };
    init();
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
    await supabase.auth.signOut();
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-black/10 bg-[#fff7ea]/90 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <a
          href="/"
          className="text-sm font-semibold uppercase tracking-[0.3em] text-black/70"
        >
          Shepherd Learning
        </a>
        {isAuthed && (
          <button
            type="button"
            onClick={handleSignOut}
            className="text-xs font-semibold uppercase tracking-[0.3em] text-black/50"
          >
            Sign out
          </button>
        )}
      </nav>
    </header>
  );
}
