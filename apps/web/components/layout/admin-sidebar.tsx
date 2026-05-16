"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { useLanguage } from "@/components/providers/language-provider";
import { LanguageSwitch } from "@/components/ui/language-switch";
import { ADMIN_MODULE_DEFS, type AdminModuleKey } from "@/lib/admin-permissions";
import { clearGuestSession } from "@/lib/guest-session";
import { supabase } from "@/lib/supabase/client";

type AdminSidebarProps = {
  adminLabel: string;
};

function SidebarIcon({ moduleKey, active }: { moduleKey: AdminModuleKey; active: boolean }) {
  const color = active ? "text-red-200" : "text-slate-400";

  if (moduleKey === "overview") {
    return (
      <svg className={`h-4 w-4 ${color}`} fill="none" viewBox="0 0 24 24">
        <path d="M4 4h7v7H4V4zm9 0h7v5h-7V4zM4 13h7v7H4v-7zm9-2h7v9h-7v-9z" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    );
  }

  if (moduleKey === "users") {
    return (
      <svg className={`h-4 w-4 ${color}`} fill="none" viewBox="0 0 24 24">
        <path
          d="M7.5 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm9 2a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM3.5 19.5a4.5 4.5 0 0 1 8.9 0M13 19.5a3.8 3.8 0 0 1 7.5 0"
          stroke="currentColor"
          strokeWidth="1.7"
        />
      </svg>
    );
  }

  if (moduleKey === "reports") {
    return (
      <svg className={`h-4 w-4 ${color}`} fill="none" viewBox="0 0 24 24">
        <path d="M5 20V10m7 10V4m7 16v-7" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
      </svg>
    );
  }

  if (moduleKey === "settings") {
    return (
      <svg className={`h-4 w-4 ${color}`} fill="none" viewBox="0 0 24 24">
        <path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7z" stroke="currentColor" strokeWidth="1.7" />
        <path
          d="M19 12a7 7 0 0 0-.1-1l2-1.6-2-3.4-2.4 1a7 7 0 0 0-1.7-1l-.3-2.6h-4l-.3 2.6a7 7 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.6a7 7 0 0 0 0 2l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 1.7 1l.3 2.6h4l.3-2.6a7 7 0 0 0 1.7-1l2.4 1 2-3.4-2-1.6c.1-.3.1-.7.1-1z"
          stroke="currentColor"
          strokeWidth="1.2"
        />
      </svg>
    );
  }

  return (
    <svg className={`h-4 w-4 ${color}`} fill="none" viewBox="0 0 24 24">
      <path d="M5 6h14M5 12h14M5 18h14" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </svg>
  );
}

export function AdminSidebar({ adminLabel }: AdminSidebarProps) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const moduleLabels: Record<AdminModuleKey, string> = {
    overview: t.adminSidebar.overview,
    users: t.adminSidebar.users,
    content: t.adminSidebar.content,
    exercises: t.adminSidebar.exercises,
    aiInsights: t.adminSidebar.aiInsights,
    reports: t.adminSidebar.reports,
    announcements: t.adminSidebar.announcements,
    activity: t.adminSidebar.activity,
    settings: t.adminSidebar.settings
  };

  const adminItems = ADMIN_MODULE_DEFS.map((item) => ({
    key: item.key,
    href: item.href,
    label: moduleLabels[item.key]
  }));

  async function handleLogout() {
    setSigningOut(true);
    clearGuestSession();
    await supabase.auth.signOut();
    setSigningOut(false);
    router.replace("/admin-login");
  }

  return (
    <aside className="hidden min-h-screen w-80 border-r border-slate-700/60 bg-[linear-gradient(180deg,#0f0f13_0%,#131218_100%)] p-5 lg:flex lg:flex-col">
      <div className="mb-5 rounded-2xl border border-red-400/30 bg-[radial-gradient(100%_120%_at_0%_0%,rgba(239,68,68,0.26),rgba(17,17,21,0.96))] p-4 shadow-[0_20px_45px_-30px_rgba(239,68,68,0.75)]">
        <p className="inline-flex rounded-full border border-red-300/45 bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-100">{t.adminSidebar.brand}</p>
        <h2 className="mt-3 text-xl font-bold text-white">{t.adminSidebar.title}</h2>
        <p className="mt-1 text-sm text-slate-300">{adminLabel}</p>
        <LanguageSwitch className="mt-3" variant="dark" />
      </div>

      <nav className="flex flex-1 flex-col gap-1.5">
        {adminItems.map((item) => {
          const active = item.href === "/admin" ? pathname === "/admin" : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              className={`gs-admin-sidebar-link group relative overflow-hidden rounded-xl border px-3 py-2 text-sm transition ${
                active
                  ? "border-red-400/45 bg-gradient-to-r from-[#391415] to-[#241015] text-white shadow-[0_12px_24px_-16px_rgba(220,38,38,0.75)]"
                  : "border-slate-700/60 bg-slate-900/45 text-slate-200 hover:border-red-400/25 hover:bg-slate-900/75 hover:text-red-100"
              }`}
              href={item.href}
            >
              {active && <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-red-400" />}
              <span className="flex items-center gap-2">
                <SidebarIcon active={active} moduleKey={item.key} />
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-5 space-y-2">
        <Link className="block rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 hover:bg-slate-800" href="/dashboard">
          {t.adminSidebar.backToUser}
        </Link>
        <button
          className="w-full rounded-xl border border-red-300/35 bg-red-500/15 px-3 py-2 text-sm text-red-100 hover:bg-red-500/20"
          disabled={signingOut}
          onClick={handleLogout}
          type="button"
        >
          {signingOut ? t.common.loading : t.common.logout}
        </button>
      </div>
    </aside>
  );
}
