"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { clearGuestSession } from "@/lib/guest-session";
import { supabase } from "@/lib/supabase/client";

const items = [
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

type SidebarProps = {
  isGuest?: boolean;
};

export function Sidebar({ isGuest = false }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    clearGuestSession();
    if (!isGuest) {
      await supabase.auth.signOut();
    }
    setIsSigningOut(false);
    router.replace("/login");
  }

  return (
    <aside className="hidden min-h-screen w-72 border-r border-cyan-200/15 bg-[linear-gradient(180deg,#050c19_0%,#0b1830_48%,#111c2d_100%)] p-5 md:flex md:flex-col">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white">GunSelf</h2>
        <p className="text-sm text-cyan-100/80">{isGuest ? "Guest Mode" : "Life OS Dashboard"}</p>
        {isGuest && (
          <span className="mt-2 inline-flex rounded-full border border-[#f28a24]/40 bg-[#f28a24]/15 px-2 py-0.5 text-xs text-orange-200">
            Read-only vibe mode
          </span>
        )}
      </div>

      <nav className="gs-client-gridline flex flex-1 flex-col gap-1 rounded-xl border border-white/5 bg-white/[0.02] p-2">
        {items.map((item) => {
          const active = item.href === "/dashboard" ? pathname === "/dashboard" : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg border px-3 py-2 text-sm transition ${
                active
                  ? "border-cyan-300/35 bg-gradient-to-r from-cyan-500/25 to-orange-400/20 font-semibold text-white shadow-[0_16px_28px_-18px_rgba(56,189,248,0.75)]"
                  : "border-transparent text-slate-100/90 hover:border-cyan-200/30 hover:bg-cyan-400/10 hover:text-cyan-100"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <button
        className="mt-4 rounded-lg border border-[#f28a24]/35 bg-[#f28a24]/10 px-3 py-2 text-sm text-orange-100 transition hover:-translate-y-0.5 hover:bg-[#f28a24]/20"
        disabled={isSigningOut}
        onClick={handleSignOut}
        type="button"
      >
        {isSigningOut ? "Signing out..." : "Logout"}
      </button>
    </aside>
  );
}
