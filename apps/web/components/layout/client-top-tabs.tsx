"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { clearGuestSession } from "@/lib/guest-session";
import { supabase } from "@/lib/supabase/client";

const tabs = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/body", label: "Body" },
  { href: "/workout", label: "Workout" },
  { href: "/nutrition", label: "Nutrition" },
  { href: "/activity", label: "Activity" },
  { href: "/sleep", label: "Sleep" },
  { href: "/mood", label: "Mood" },
  { href: "/goals", label: "Goals" },
  { href: "/skills", label: "Skills" },
  { href: "/finance", label: "Finance" },
  { href: "/ai-coach", label: "AI Coach" },
  { href: "/settings", label: "Settings" }
];

type ClientTopTabsProps = {
  isGuest?: boolean;
};

export function ClientTopTabs({ isGuest = false }: ClientTopTabsProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    clearGuestSession();
    if (!isGuest) {
      await supabase.auth.signOut();
    }
    setSigningOut(false);
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-30 border-b border-red-500/20 bg-[linear-gradient(180deg,rgba(7,10,15,0.94)_0%,rgba(9,12,18,0.88)_100%)] backdrop-blur">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-3 md:px-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="gs-display text-3xl uppercase tracking-[0.12em] text-white">GunSelf</p>
            <p className="text-xs uppercase tracking-[0.2em] text-red-300/90">Personal Life Operating System</p>
          </div>
          <div className="flex items-center gap-2">
            {isGuest && (
              <span className="rounded-full border border-orange-400/35 bg-orange-500/15 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-orange-200">
                Guest Mode
              </span>
            )}
            <button
              className="rounded-lg border border-red-300/35 bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-red-100 hover:bg-red-500/25 disabled:opacity-60"
              disabled={signingOut}
              onClick={handleSignOut}
              type="button"
            >
              {signingOut ? "Signing out..." : "Logout"}
            </button>
          </div>
        </div>

        <nav className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
          {tabs.map((tab) => {
            const active = tab.href === "/dashboard" ? pathname === "/dashboard" : pathname === tab.href || pathname.startsWith(`${tab.href}/`);

            return (
              <Link
                key={tab.href}
                className={`whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
                  active
                    ? "border-red-300/55 bg-gradient-to-r from-red-500/25 to-orange-400/20 text-white shadow-[0_14px_24px_-18px_rgba(239,68,68,0.85)]"
                    : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-red-300/40 hover:text-red-100"
                }`}
                href={tab.href}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
