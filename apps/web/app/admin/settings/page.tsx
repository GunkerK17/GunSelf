"use client";

import { type FormEvent, useEffect, useState } from "react";
import type { Database } from "@gunself/types";

import { useLanguage } from "@/components/providers/language-provider";
import { useAdminUi } from "@/components/providers/admin-ui-provider";
import { LanguageSwitch } from "@/components/ui/language-switch";
import { supabase } from "@/lib/supabase/client";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

function formatDate(dateStr: string | null) {
  if (!dateStr) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(dateStr));
}

export default function AdminSettingsPage() {
  const { t } = useLanguage();
  const { enable3d, enableAnimations, depthMode, setEnable3d, setEnableAnimations, setDepthMode } = useAdminUi();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    password: "",
    confirmPassword: ""
  });
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadCurrentProfile() {
      setLoadingProfile(true);
      setError(null);

      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session?.user.id) {
        if (active) {
          setLoadingProfile(false);
          setError("Please login again.");
        }
        return;
      }

      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("id,display_name,email,phone,role,is_super_admin,created_at,timezone")
        .eq("id", session.user.id)
        .maybeSingle();

      if (!active) {
        return;
      }

      if (profileError || !data) {
        setError(profileError?.message ?? "Cannot load profile.");
        setProfile(null);
        setLoadingProfile(false);
        return;
      }

      setProfile(data as ProfileRow);
      setLoadingProfile(false);
    }

    void loadCurrentProfile();

    return () => {
      active = false;
    };
  }, []);

  async function handleChangeOwnPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (!profile || profile.role !== "admin") {
      setError("Only admin account can use this form.");
      return;
    }

    if (passwordForm.password.trim().length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    if (passwordForm.password !== passwordForm.confirmPassword) {
      setError("Password confirmation does not match.");
      return;
    }

    setSavingPassword(true);
    const { error: updateError } = await supabase.auth.updateUser({
      password: passwordForm.password
    });
    setSavingPassword(false);

    if (updateError) {
      setError(`Change password failed: ${updateError.message}`);
      return;
    }

    setPasswordForm({ password: "", confirmPassword: "" });
    setNotice("Password updated successfully.");

    await supabase.from("admin_audit_logs").insert({
      actor_user_id: profile.id,
      target_user_id: profile.id,
      action: "change_own_password",
      entity: "user",
      message: "Admin changed their own password",
      metadata: {}
    });
  }

  return (
    <section className="space-y-4">
      <header className="rounded-3xl border border-slate-300 bg-white p-5 shadow-[0_20px_38px_-28px_rgba(15,23,42,0.42)]">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t.adminSettings.title}</h1>
        <p className="mt-1 text-sm text-slate-600">Simple settings for your single-admin workspace.</p>
      </header>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</div>}

      <div className="grid gap-3 lg:grid-cols-3">
        <article className="gs-admin-tile rounded-2xl border border-slate-300 bg-white p-4">
          <h2 className="text-lg font-semibold text-slate-900">{t.adminSettings.languageTitle}</h2>
          <p className="mt-1 text-sm text-slate-600">{t.adminSettings.languageSubtitle}</p>
          <LanguageSwitch className="mt-4" />
        </article>

        <article className="gs-admin-tile rounded-2xl border border-slate-300 bg-white p-4">
          <h2 className="text-lg font-semibold text-slate-900">{t.adminSettings.appearanceTitle}</h2>
          <p className="mt-1 text-sm text-slate-600">{t.adminSettings.appearanceSubtitle}</p>
          <div className="mt-4 flex gap-2">
            <span className="h-8 w-8 rounded-full border border-slate-300 bg-white" />
            <span className="h-8 w-8 rounded-full border border-red-300 bg-red-600" />
            <span className="h-8 w-8 rounded-full border border-slate-300 bg-slate-400" />
            <span className="h-8 w-8 rounded-full border border-slate-700 bg-black" />
          </div>
        </article>

        <article className="gs-admin-tile rounded-2xl border border-slate-300 bg-white p-4">
          <h2 className="text-lg font-semibold text-slate-900">{t.adminSettings.motionTitle}</h2>
          <p className="mt-1 text-sm text-slate-600">{t.adminSettings.motionSubtitle}</p>
          <div className="mt-4 space-y-2 rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm text-slate-700">
            <div className="flex flex-wrap items-center gap-2">
              <button
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                  enable3d ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-700"
                }`}
                onClick={() => setEnable3d(true)}
                type="button"
              >
                3D ON
              </button>
              <button
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                  !enable3d ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-700"
                }`}
                onClick={() => setEnable3d(false)}
                type="button"
              >
                3D OFF
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                  enableAnimations ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-700"
                }`}
                onClick={() => setEnableAnimations(true)}
                type="button"
              >
                Animation ON
              </button>
              <button
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                  !enableAnimations ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-700"
                }`}
                onClick={() => setEnableAnimations(false)}
                type="button"
              >
                Animation OFF
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                  depthMode === "normal" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-700"
                }`}
                disabled={!enable3d}
                onClick={() => setDepthMode("normal")}
                type="button"
              >
                3D Normal
              </button>
              <button
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                  depthMode === "pro" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-700"
                }`}
                disabled={!enable3d}
                onClick={() => setDepthMode("pro")}
                type="button"
              >
                3D Pro
              </button>
            </div>
          </div>
        </article>
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        <article className="gs-admin-tile rounded-2xl border border-slate-300 bg-white p-4 shadow-[0_16px_34px_-28px_rgba(15,23,42,0.4)]">
          <h2 className="text-lg font-semibold text-slate-900">Admin Account</h2>
          {loadingProfile ? (
            <p className="mt-2 text-sm text-slate-500">Loading...</p>
          ) : !profile ? (
            <p className="mt-2 text-sm text-rose-600">No profile found.</p>
          ) : (
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              <div>
                <span className="font-semibold text-slate-900">Name:</span> {profile.display_name || "-"}
              </div>
              <div>
                <span className="font-semibold text-slate-900">Email:</span> {profile.email || "-"}
              </div>
              <div>
                <span className="font-semibold text-slate-900">Phone:</span> {profile.phone || "-"}
              </div>
              <div>
                <span className="font-semibold text-slate-900">Role:</span> {profile.is_super_admin ? "Super Admin" : "Admin"}
              </div>
              <div>
                <span className="font-semibold text-slate-900">Timezone:</span> {profile.timezone || "-"}
              </div>
              <div>
                <span className="font-semibold text-slate-900">Created at:</span> {formatDate(profile.created_at)}
              </div>
            </div>
          )}
        </article>

        <article className="gs-admin-tile rounded-2xl border border-slate-300 bg-white p-4 shadow-[0_16px_34px_-28px_rgba(15,23,42,0.4)]">
          <h2 className="text-lg font-semibold text-slate-900">Change Password</h2>
          <p className="mt-1 text-sm text-slate-600">Use this form to update your admin password.</p>
          <form className="mt-3 space-y-2" onSubmit={(event) => void handleChangeOwnPassword(event)}>
            <input
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-red-300 focus:outline-none"
              minLength={8}
              onChange={(event) => setPasswordForm((prev) => ({ ...prev, password: event.target.value }))}
              placeholder="New password (min 8 chars)"
              required
              type="password"
              value={passwordForm.password}
            />
            <input
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-red-300 focus:outline-none"
              minLength={8}
              onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
              placeholder="Confirm new password"
              required
              type="password"
              value={passwordForm.confirmPassword}
            />
            <button
              className="w-full rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-60"
              disabled={savingPassword}
              type="submit"
            >
              {savingPassword ? t.common.loading : "Update password"}
            </button>
          </form>
        </article>
      </div>
    </section>
  );
}
