"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { AuthShell } from "@/components/forms/auth-shell";
import { clearGuestSession, isGuestSession, setLastAuthMethod, startGuestSession } from "@/lib/guest-session";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isGuestSession()) {
      router.replace("/dashboard");
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace("/dashboard");
      }
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        router.replace("/dashboard");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  async function handleEmailLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    clearGuestSession();
    setLastAuthMethod("email");
    router.replace("/dashboard");
  }

  async function handleGoogleLogin() {
    setLoading(true);
    setError(null);
    clearGuestSession();
    setLastAuthMethod("google");

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (oauthError) {
      setLoading(false);
      setError(oauthError.message);
    }
  }

  function handleGuestLogin() {
    clearGuestSession();
    startGuestSession();
    setLastAuthMethod("guest");
    router.replace("/dashboard");
  }

  return (
    <AuthShell
      title="Sign In"
      subtitle="Use your email account or Google."
      panelTitle="Hello, Friend!"
      panelText="Register with your personal details to access all GunSelf features."
      panelButtonHref="/register"
      panelButtonLabel="Sign up"
      panelSide="right"
      footer={
        <>
          No account?{" "}
          <Link className="font-medium text-red-700 hover:text-red-600" href="/register">
            Register here
          </Link>
        </>
      }
    >
      <form className="space-y-3" onSubmit={handleEmailLogin}>
        <input
          className="gs-auth-input"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          required
          type="email"
          value={email}
        />
        <input
          className="gs-auth-input"
          minLength={8}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          required
          type="password"
          value={password}
        />
        <button
          className="gs-auth-primary-btn"
          disabled={loading}
          type="submit"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div className="my-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs uppercase tracking-wider text-slate-400">or</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <button
        className="gs-auth-secondary-btn"
        disabled={loading}
        onClick={handleGoogleLogin}
        type="button"
      >
        Continue with Google
      </button>
      <button
        className="mt-3 w-full rounded-xl border border-red-300/40 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 transition hover:-translate-y-0.5 hover:bg-red-100"
        disabled={loading}
        onClick={handleGuestLogin}
        type="button"
      >
        Continue as Guest
      </button>
      {error && <p className="mt-4 text-sm text-rose-500">{error}</p>}
    </AuthShell>
  );
}
