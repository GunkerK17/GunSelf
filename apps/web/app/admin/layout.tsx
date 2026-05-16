"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminUiProvider, useAdminUi } from "@/components/providers/admin-ui-provider";
import { isGuestSession } from "@/lib/guest-session";
import { supabase } from "@/lib/supabase/client";

type GuardState = "loading" | "authorized" | "unauthorized";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminUiProvider>
      <AdminLayoutShell>{children}</AdminLayoutShell>
    </AdminUiProvider>
  );
}

function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { enable3d, enableAnimations, depthMode } = useAdminUi();
  const [guardState, setGuardState] = useState<GuardState>("loading");
  const [adminLabel, setAdminLabel] = useState("Admin");

  useEffect(() => {
    let active = true;

    async function checkAccess() {
      if (isGuestSession()) {
        if (!active) return;
        setGuardState("unauthorized");
        return;
      }

      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/admin-login");
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("display_name, role")
        .eq("id", session.user.id)
        .maybeSingle();

      if (!active) return;

      if (error || !profile || profile.role !== "admin") {
        setGuardState("unauthorized");
        return;
      }

      setAdminLabel(profile.display_name || session.user.email || "Admin");
      setGuardState("authorized");
    }

    void checkAccess();

    return () => {
      active = false;
    };
  }, [router]);

  if (guardState === "loading") {
    return (
      <div className="grid min-h-screen place-items-center bg-[#090909] text-slate-200">
        <p className="rounded-xl border border-red-400/30 bg-slate-900 px-4 py-2">Checking admin access...</p>
      </div>
    );
  }

  if (guardState === "unauthorized") {
    return (
      <div className="grid min-h-screen place-items-center bg-[#090909] px-6">
        <div className="max-w-xl rounded-2xl border border-red-300/30 bg-slate-950/85 p-6 text-center shadow-[0_24px_60px_-36px_rgba(239,68,68,0.45)]">
          <h1 className="gs-display text-2xl font-bold text-white">Admin access required</h1>
          <p className="mt-2 text-sm text-slate-300">
            Your account does not have admin privileges yet. Ask the project owner to set your role to <code>admin</code> in
            <code> profiles.role</code>.
          </p>
          <button
            className="mt-5 rounded-xl border border-red-300/35 bg-red-500/15 px-4 py-2 text-sm font-medium text-red-100 hover:bg-red-500/22"
            onClick={() => router.replace("/dashboard")}
            type="button"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  const uiClassNames = [
    enableAnimations ? "gs-admin-motion-on" : "gs-admin-motion-off",
    enable3d ? (depthMode === "pro" ? "gs-admin-depth-pro" : "gs-admin-depth-normal") : "gs-admin-depth-off"
  ].join(" ");

  return (
    <div
      className={`relative min-h-screen bg-[radial-gradient(65%_65%_at_4%_0%,rgba(239,68,68,0.16),transparent_68%),radial-gradient(52%_52%_at_96%_0%,rgba(148,163,184,0.16),transparent_64%),linear-gradient(180deg,#0b0b0b_0%,#141414_100%)] ${uiClassNames}`}
    >
      <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:repeating-linear-gradient(90deg,rgba(255,255,255,0.05)_0_1px,transparent_1px_16px)]" />
      <div className="relative flex min-h-screen">
        <AdminSidebar adminLabel={adminLabel} />
        <main className="w-full p-5 md:p-7">{children}</main>
      </div>
    </div>
  );
}
