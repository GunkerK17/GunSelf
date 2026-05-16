"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import type { Database } from "@gunself/types";

import { supabase } from "@/lib/supabase/client";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

function formatDateTime(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState({
    displayName: "",
    phone: "",
    timezone: "Asia/Bangkok"
  });
  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: ""
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session?.user) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      setError("Please login first.");
      return;
    }

    setUser(session.user);

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .maybeSingle();

    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }

    setProfile(profileData ?? null);
    setProfileForm({
      displayName: profileData?.display_name ?? "",
      phone: profileData?.phone ?? "",
      timezone: profileData?.timezone ?? "Asia/Bangkok"
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      setError("Please login first.");
      return;
    }

    setSavingProfile(true);
    setError(null);
    setNotice(null);

    const patch: Database["public"]["Tables"]["profiles"]["Update"] = {
      display_name: profileForm.displayName.trim() || null,
      phone: profileForm.phone.trim() || null,
      timezone: profileForm.timezone.trim() || null
    };

    const { data, error: updateError } = await supabase.from("profiles").update(patch).eq("id", user.id).select("*").single();

    if (updateError || !data) {
      setError(updateError?.message ?? "Update profile failed.");
      setSavingProfile(false);
      return;
    }

    setProfile(data);
    setSavingProfile(false);
    setNotice("Profile updated.");
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (passwordForm.newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("Password confirmation does not match.");
      return;
    }

    setSavingPassword(true);
    setError(null);
    setNotice(null);

    const { error: updateError } = await supabase.auth.updateUser({ password: passwordForm.newPassword });

    if (updateError) {
      setError(updateError.message);
      setSavingPassword(false);
      return;
    }

    setPasswordForm({ newPassword: "", confirmPassword: "" });
    setSavingPassword(false);
    setNotice("Password updated.");
  }

  return (
    <section className="space-y-4">
      <header className="gs-client-panel gs-client-panel-3d rounded-2xl p-6">
        <h1 className="text-2xl font-semibold text-[#0f172a]">Settings</h1>
        <p className="mt-2 text-slate-600">Update profile info and account password.</p>
      </header>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</div>}

      {loading ? (
        <article className="gs-client-panel gs-client-panel-3d rounded-2xl p-6 text-sm text-slate-600">Loading account...</article>
      ) : (
        <>
          <article className="gs-client-panel gs-client-panel-3d rounded-2xl p-4">
            <h2 className="text-lg font-semibold text-slate-900">Account Overview</h2>
            <div className="mt-3 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
              <p>
                <span className="font-semibold text-slate-900">Email:</span> {profile?.email ?? user?.email ?? "-"}
              </p>
              <p>
                <span className="font-semibold text-slate-900">Role:</span> {profile?.role ?? "user"}
              </p>
              <p>
                <span className="font-semibold text-slate-900">User ID:</span> {profile?.id ?? user?.id ?? "-"}
              </p>
              <p>
                <span className="font-semibold text-slate-900">Created:</span> {formatDateTime(profile?.created_at ?? null)}
              </p>
            </div>
          </article>

          <article className="gs-client-panel gs-client-panel-3d rounded-2xl p-4">
            <h2 className="mb-2 text-lg font-semibold text-slate-900">Profile</h2>
            <form className="grid gap-2 md:grid-cols-2" onSubmit={(event) => void handleProfileSubmit(event)}>
              <input
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                onChange={(event) => setProfileForm((prev) => ({ ...prev, displayName: event.target.value }))}
                placeholder="Display name"
                value={profileForm.displayName}
              />
              <input
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                onChange={(event) => setProfileForm((prev) => ({ ...prev, phone: event.target.value }))}
                placeholder="Phone number"
                value={profileForm.phone}
              />
              <input
                className="md:col-span-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                onChange={(event) => setProfileForm((prev) => ({ ...prev, timezone: event.target.value }))}
                placeholder="Timezone"
                value={profileForm.timezone}
              />
              <button
                className="md:col-span-2 rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                disabled={savingProfile}
                type="submit"
              >
                {savingProfile ? "Saving..." : "Save Profile"}
              </button>
            </form>
          </article>

          <article className="gs-client-panel gs-client-panel-3d rounded-2xl p-4">
            <h2 className="mb-2 text-lg font-semibold text-slate-900">Change Password</h2>
            <form className="grid gap-2 md:grid-cols-2" onSubmit={(event) => void handlePasswordSubmit(event)}>
              <input
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                minLength={8}
                onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
                placeholder="New password"
                type="password"
                value={passwordForm.newPassword}
              />
              <input
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                minLength={8}
                onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                placeholder="Confirm new password"
                type="password"
                value={passwordForm.confirmPassword}
              />
              <button
                className="md:col-span-2 rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                disabled={savingPassword}
                type="submit"
              >
                {savingPassword ? "Updating..." : "Update Password"}
              </button>
            </form>
          </article>
        </>
      )}
    </section>
  );
}
