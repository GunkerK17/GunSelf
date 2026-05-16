"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { clearGuestSession, setLastAuthMethod } from "@/lib/guest-session";
import { supabase } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const handledRef = useRef(false);
  const next = searchParams.get("next");
  const backToLoginPath = next?.startsWith("/admin") ? "/admin-login" : "/login";

  useEffect(() => {
    if (handledRef.current) {
      return;
    }
    handledRef.current = true;

    const code = searchParams.get("code");
    const incomingError = searchParams.get("error_description") || searchParams.get("error");
    const requestedNext = searchParams.get("next");
    const targetPath =
      requestedNext && requestedNext.startsWith("/") && !requestedNext.startsWith("//") && !requestedNext.startsWith("/auth/callback")
        ? requestedNext
        : "/dashboard";

    async function completeOAuth() {
      if (incomingError) {
        setError(decodeURIComponent(incomingError));
        return;
      }

      const {
        data: { session: existingSession }
      } = await supabase.auth.getSession();

      if (existingSession) {
        clearGuestSession();
        setLastAuthMethod("google");
        router.replace(targetPath);
        return;
      }

      if (!code) {
        const hash = typeof window !== "undefined" ? window.location.hash : "";
        const hasTokenInHash = hash.includes("access_token=") || hash.includes("refresh_token=");

        if (hasTokenInHash) {
          await new Promise((resolve) => setTimeout(resolve, 250));
          const {
            data: { session: hashSession }
          } = await supabase.auth.getSession();

          if (hashSession) {
            clearGuestSession();
            setLastAuthMethod("google");
            router.replace(targetPath);
            return;
          }
        }

        setError("Missing OAuth code in callback URL.");
        return;
      }

      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        setError(exchangeError.message);
        return;
      }

      if (!data.session) {
        const {
          data: { session: refreshedSession }
        } = await supabase.auth.getSession();

        if (!refreshedSession) {
          setError("OAuth completed but no session was created.");
          return;
        }
      }

      clearGuestSession();
      setLastAuthMethod("google");
      router.replace(targetPath);
    }

    completeOAuth().catch((reason: unknown) => {
      setError(reason instanceof Error ? reason.message : "OAuth callback failed.");
    });
  }, [router, searchParams]);

  if (error) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 px-6 text-center text-slate-100">
        <div className="max-w-xl rounded-2xl border border-rose-300/30 bg-rose-900/20 p-5">
          <h1 className="text-xl font-semibold text-rose-200">Google sign-in failed</h1>
          <p className="mt-2 text-sm text-rose-100">{error}</p>
          <button
            className="mt-4 rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 text-sm hover:bg-slate-800"
            onClick={() => router.replace(backToLoginPath)}
            type="button"
          >
            Back to login
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 text-slate-100">
      <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm">Completing Google sign-in...</p>
    </main>
  );
}
