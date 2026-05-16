"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { supabase } from "@/lib/supabase/client";

export default function AdminResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recoveryReady, setRecoveryReady] = useState(false);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) {
        return;
      }

      if (data.session) {
        setRecoveryReady(true);
      }
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) {
        return;
      }

      if (event === "PASSWORD_RECOVERY" || !!session) {
        setRecoveryReady(true);
        setError(null);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!recoveryReady) {
      setError("Recovery session not ready yet. Please open the email link again.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password confirmation does not match.");
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setMessage("Password updated successfully. Redirecting to admin login...");
    setTimeout(() => router.replace("/admin-login"), 1000);
  }

  return (
    <main className="gs-admin-login-bg relative min-h-screen overflow-hidden text-white">
      <div className="gs-admin-noise pointer-events-none absolute inset-0 opacity-45" />
      <div className="gs-admin-aurora pointer-events-none absolute inset-0 opacity-70" />
      <div className="relative mx-auto flex min-h-screen max-w-xl items-center px-6">
        <section className="w-full rounded-3xl border border-red-300/25 bg-[#120f11]/92 p-7 shadow-[0_42px_90px_-50px_rgba(0,0,0,0.88)] backdrop-blur-xl">
          <h1 className="gs-display text-3xl font-bold">Reset Admin Password</h1>
          <p className="mt-2 text-sm text-slate-300">Create a new password for your GunSelf admin account.</p>

          <form className="mt-6 space-y-3" onSubmit={handleResetPassword}>
            <input
              className="w-full rounded-xl border border-red-300/25 bg-slate-900/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-red-400/70 focus:outline-none"
              minLength={8}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="New password"
              required
              type="password"
              value={password}
            />
            <input
              className="w-full rounded-xl border border-red-300/25 bg-slate-900/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-red-400/70 focus:outline-none"
              minLength={8}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirm new password"
              required
              type="password"
              value={confirmPassword}
            />
            <button
              className="gs-admin-cta-btn w-full rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 px-4 py-3 text-sm font-semibold text-white"
              disabled={loading || !recoveryReady}
              type="submit"
            >
              {loading ? "Updating..." : recoveryReady ? "Update password" : "Waiting for recovery session..."}
            </button>
          </form>

          {message && <p className="mt-4 text-sm text-emerald-300">{message}</p>}
          {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}

          <div className="mt-6 border-t border-slate-800 pt-4 text-sm text-slate-400">
            <Link className="font-medium text-red-300 hover:text-red-200" href="/admin-login">
              Back to admin login
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
