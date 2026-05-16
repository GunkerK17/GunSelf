"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { AuthShell } from "@/components/forms/auth-shell";
import { clearGuestSession, setLastAuthMethod } from "@/lib/guest-session";
import { supabase } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName
        },
        emailRedirectTo: `${window.location.origin}/dashboard`
      }
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    setMessage("Account created successfully.");
    clearGuestSession();
    setLastAuthMethod("register");

    if (data.session) {
      router.replace("/dashboard");
      return;
    }

    setMessage("Account created. Check your email for verification, then login.");
  }

  async function handleGoogleRegister() {
    setLoading(true);
    setError(null);
    setMessage(null);
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

  return (
    <AuthShell
      title="Create Account"
      subtitle="Use your email account to get started."
      panelTitle="Welcome Back!"
      panelText="Enter your personal details to use all GunSelf features."
      panelButtonHref="/login"
      panelButtonLabel="Sign in"
      panelSide="left"
      footer={
        <>
          Already have an account?{" "}
          <Link className="font-medium text-red-700 hover:text-red-600" href="/login">
            Login here
          </Link>
        </>
      }
    >
      <form className="space-y-3" onSubmit={handleRegister}>
        <input
          className="gs-auth-input"
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder="Display name"
          type="text"
          value={displayName}
        />
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
          placeholder="Create password (min 8 chars)"
          required
          type="password"
          value={password}
        />
        <button
          className="gs-auth-primary-btn"
          disabled={loading}
          type="submit"
        >
          {loading ? "Creating account..." : "Create account"}
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
        onClick={handleGoogleRegister}
        type="button"
      >
        Continue with Google
      </button>

      {message && <p className="mt-4 text-sm text-emerald-600">{message}</p>}
      {error && <p className="mt-4 text-sm text-rose-500">{error}</p>}
    </AuthShell>
  );
}
