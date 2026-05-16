"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { useLanguage } from "@/components/providers/language-provider";
import { LanguageSwitch } from "@/components/ui/language-switch";
import { clearGuestSession, setLastAuthMethod } from "@/lib/guest-session";
import { supabase } from "@/lib/supabase/client";

type ModuleKind = "workout" | "football" | "learning" | "health" | "time";

function ModuleIcon({ kind }: { kind: ModuleKind }) {
  const common = "h-4 w-4 text-[#f9d7cf]";

  if (kind === "workout") {
    return (
      <svg className={common} fill="none" viewBox="0 0 24 24">
        <path d="M4 10v4M7 9v6m10-6v6m3-5v4M9 12h6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      </svg>
    );
  }

  if (kind === "football") {
    return (
      <svg className={common} fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 8l2.2 1.6-.8 2.5h-2.8l-.8-2.5L12 8z" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }

  if (kind === "learning") {
    return (
      <svg className={common} fill="none" viewBox="0 0 24 24">
        <path d="M4 7.5h7v10H4v-10zm9 0h7v10h-7v-10z" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    );
  }

  if (kind === "health") {
    return (
      <svg className={common} fill="none" viewBox="0 0 24 24">
        <path d="M12 20s-6.5-3.8-6.5-8.8a3.7 3.7 0 0 1 6.2-2.7l.3.3.3-.3a3.7 3.7 0 0 1 6.2 2.7C18.5 16.2 12 20 12 20z" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    );
  }

  return (
    <svg className={common} fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 8v4l2.5 1.7" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

export default function AdminLoginPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function verifyAdminAndRedirect(userId: string) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (profileError || !profile || profile.role !== "admin") {
      await supabase.auth.signOut();
      setError("This account is not an admin account yet.");
      setLoading(false);
      return;
    }

    router.replace("/admin");
  }

  async function handlePasswordLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    clearGuestSession();
    setLastAuthMethod("admin-email");

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInError || !data.user) {
      setError(signInError?.message || "Unable to sign in.");
      setLoading(false);
      return;
    }

    await verifyAdminAndRedirect(data.user.id);
  }

  async function handleGoogleLogin() {
    setLoading(true);
    setError(null);
    clearGuestSession();
    setLastAuthMethod("admin-google");

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/admin`
      }
    });

    if (oauthError) {
      setError(oauthError.message);
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!email) {
      setError("Enter your admin email first, then click Forgot password.");
      return;
    }

    setLoading(true);
    setError(null);

    const normalizedEmail = email.trim().toLowerCase();
    const { data: adminProfile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (profileError || !adminProfile || adminProfile.role !== "admin") {
      setError("Only admin accounts can use this reset form.");
      setLoading(false);
      return;
    }

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${window.location.origin}/auth/callback?next=/admin-reset-password`
    });

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setError("Password reset email sent. Check inbox and spam folder.");
    setLoading(false);
  }

  const modules = [
    { key: "workout" as const, label: t.adminLogin.modules.workout },
    { key: "football" as const, label: t.adminLogin.modules.sport },
    { key: "learning" as const, label: t.adminLogin.modules.learning },
    { key: "health" as const, label: t.adminLogin.modules.health },
    { key: "time" as const, label: t.adminLogin.modules.time }
  ];

  return (
    <main className="gs-admin-login-bg relative min-h-screen overflow-hidden text-white">
      <div className="gs-admin-noise pointer-events-none absolute inset-0 opacity-45" />
      <div className="gs-admin-aurora pointer-events-none absolute inset-0 opacity-70" />
      <div className="gs-admin-scanlines pointer-events-none absolute inset-0 opacity-35" />
      <div className="gs-admin-orb gs-admin-orb-cyan pointer-events-none absolute" />
      <div className="gs-admin-orb gs-admin-orb-violet pointer-events-none absolute" />
      <div className="gs-admin-orb gs-admin-orb-emerald pointer-events-none absolute" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-6 py-10">
        <section className="grid w-full overflow-hidden rounded-[2rem] border border-slate-600 bg-[#120f11]/92 shadow-[0_46px_100px_-54px_rgba(0,0,0,0.85)] backdrop-blur-xl lg:grid-cols-[1.1fr_0.9fr]">
          <article className="relative p-8 md:p-10">
            <div className="flex items-center justify-between gap-3">
              <p className="inline-flex rounded-full border border-red-300/40 bg-red-500/20 px-3 py-1 text-xs uppercase tracking-widest text-[#ffd9d0]">
                GunSelf Admin
              </p>
              <LanguageSwitch />
            </div>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-white md:text-5xl">{t.adminLogin.title}</h1>
            <p className="mt-2 text-sm text-slate-300">{t.adminLogin.subtitle}</p>

            <form className="mt-7 space-y-3" onSubmit={handlePasswordLogin}>
              <input
                className="w-full rounded-xl border border-slate-500/40 bg-slate-900/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-red-400 focus:outline-none"
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t.adminLogin.emailPlaceholder}
                required
                type="email"
                value={email}
              />
              <input
                className="w-full rounded-xl border border-slate-500/40 bg-slate-900/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-red-400 focus:outline-none"
                onChange={(event) => setPassword(event.target.value)}
                placeholder={t.adminLogin.passwordPlaceholder}
                required
                type="password"
                value={password}
              />
              <button
                className="gs-admin-cta-btn w-full appearance-none rounded-xl px-4 py-3 text-sm font-semibold text-white"
                disabled={loading}
                type="submit"
              >
                {loading ? t.adminLogin.signingIn : t.adminLogin.signIn}
              </button>
            </form>

            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-700" />
              <span className="text-xs uppercase tracking-wider text-slate-500">or</span>
              <div className="h-px flex-1 bg-slate-700" />
            </div>

            <button
              className="gs-admin-ghost-btn w-full rounded-xl border border-slate-600 bg-slate-900/70 px-4 py-3 text-sm font-medium text-slate-100"
              disabled={loading}
              onClick={handleGoogleLogin}
              type="button"
            >
              {t.adminLogin.continueGoogle}
            </button>
            <button
              className="mt-3 w-full rounded-xl border border-red-300/30 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-100 transition hover:bg-red-500/15"
              disabled={loading}
              onClick={handleForgotPassword}
              type="button"
            >
              {t.adminLogin.forgotPassword}
            </button>

            <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-5">
              {modules.map((item) => (
                <div
                  key={item.key}
                  className="gs-admin-module-chip rounded-xl border border-red-300/30 bg-slate-900/55 px-2 py-2 text-center text-[11px] font-medium text-[#ffe2da]"
                >
                  <div className="mb-1 flex justify-center">
                    <ModuleIcon kind={item.key} />
                  </div>
                  {item.label}
                </div>
              ))}
            </div>

            {error && (
              <p className={`mt-4 text-sm ${error.startsWith("Password reset email sent") ? "text-emerald-300" : "text-rose-300"}`}>
                {error}
              </p>
            )}

            <div className="mt-6 border-t border-slate-800 pt-4 text-sm text-slate-400">
              {t.adminLogin.needUserAccess}{" "}
              <Link className="font-medium text-red-300 hover:text-red-200" href="/login">
                {t.adminLogin.goUserLogin}
              </Link>
            </div>
          </article>

          <article className="gs-admin-panel gs-admin-panel-3d relative hidden items-center justify-center overflow-hidden p-10 lg:flex">
            <div className="gs-admin-floating-cube gs-admin-cube-1 pointer-events-none absolute" />
            <div className="gs-admin-floating-cube gs-admin-cube-2 pointer-events-none absolute" />
            <div className="gs-admin-floating-cube gs-admin-cube-3 pointer-events-none absolute" />
            <div className="gs-admin-floating-chip left-[8%] top-[14%]">
              <ModuleIcon kind="workout" />
            </div>
            <div className="gs-admin-floating-chip left-[78%] top-[22%] [animation-delay:500ms]">
              <ModuleIcon kind="football" />
            </div>
            <div className="gs-admin-floating-chip left-[12%] bottom-[16%] [animation-delay:1000ms]">
              <ModuleIcon kind="learning" />
            </div>
            <div className="gs-admin-floating-chip right-[10%] bottom-[18%] [animation-delay:1500ms]">
              <ModuleIcon kind="health" />
            </div>
            <div className="gs-admin-floating-chip left-[44%] top-[8%] [animation-delay:900ms]">
              <ModuleIcon kind="time" />
            </div>
            <div className="gs-admin-panel-card relative z-10 w-full max-w-sm rounded-3xl border border-red-300/30 bg-white/10 p-6 text-center backdrop-blur-xl">
              <Image alt="GunSelf logo" className="mx-auto h-auto w-full max-w-[250px]" height={160} src="/branding/gunself-logo.png" width={250} />
              <h2 className="mt-5 text-3xl font-bold">{t.adminLogin.controlTitle}</h2>
              <p className="mt-2 text-sm text-[#ffd9d0]/90">{t.adminLogin.controlSubtitle}</p>
              <div className="mt-4 inline-flex rounded-full border border-red-300/40 bg-red-500/15 px-3 py-1 text-xs text-[#ffd9d0]">
                3D Admin Experience
              </div>
            </div>
            <div className="gs-admin-ring pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-red-300/30" />
          </article>
        </section>
      </div>
    </main>
  );
}
