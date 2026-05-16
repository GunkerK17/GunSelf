"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ClientTopTabs } from "@/components/layout/client-top-tabs";
import { isGuestSession } from "@/lib/guest-session";
import { supabase } from "@/lib/supabase/client";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    let active = true;

    async function bootstrapAuth() {
      const guestMode = isGuestSession();

      if (guestMode) {
        if (!active) {
          return;
        }
        setIsGuest(true);
        setHasAccess(true);
        setLoading(false);
        return;
      }

      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (session) {
        if (!active) {
          return;
        }
        setIsGuest(false);
        setHasAccess(true);
        setLoading(false);
        return;
      }

      const { data: userData } = await supabase.auth.getUser();

      if (!active) {
        return;
      }

      setIsGuest(false);
      setHasAccess(Boolean(userData.user));
      setLoading(false);
    }

    void bootstrapAuth();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const guestMode = isGuestSession();
      setIsGuest(!session && guestMode);
      setHasAccess(Boolean(session) || guestMode);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!loading && !hasAccess) {
      router.replace("/login");
    }
  }, [hasAccess, loading, router]);

  if (loading || !hasAccess) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#070e1c] text-slate-200">
        <p className="rounded-xl border border-cyan-200/20 bg-cyan-300/10 px-4 py-2">Checking your session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(110%_90%_at_0%_0%,rgba(239,68,68,0.18),transparent_55%),radial-gradient(90%_90%_at_100%_0%,rgba(59,130,246,0.08),transparent_58%),linear-gradient(180deg,#040507_0%,#090d15_100%)]">
      <ClientTopTabs isGuest={isGuest} />
      <main className="mx-auto w-full max-w-[1400px] px-4 py-5 md:px-6 md:py-6">
        <div className="gs-client-stage rounded-3xl p-5 md:p-7">{children}</div>
      </main>
    </div>
  );
}
