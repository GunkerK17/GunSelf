"use client";

import Image from "next/image";
import Link from "next/link";

type AuthShellProps = {
  title: string;
  subtitle: string;
  footer: React.ReactNode;
  children: React.ReactNode;
  panelTitle: string;
  panelText: string;
  panelButtonLabel: string;
  panelButtonHref: string;
  panelSide?: "left" | "right";
};

export function AuthShell({
  title,
  subtitle,
  footer,
  children,
  panelTitle,
  panelText,
  panelButtonLabel,
  panelButtonHref,
  panelSide = "right"
}: AuthShellProps) {
  const panelOnLeft = panelSide === "left";

  return (
    <main className="gs-auth-root relative min-h-screen overflow-hidden text-slate-900">
      <div className="gs-auth-layer-glow pointer-events-none absolute inset-0" />
      <div className="gs-auth-layer-grid pointer-events-none absolute inset-0 opacity-40" />
      <div className="gs-auth-layer-vignette pointer-events-none absolute inset-0" />
      <div className="gs-auth-orb gs-auth-orb-left pointer-events-none absolute" />
      <div className="gs-auth-orb gs-auth-orb-right pointer-events-none absolute" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-10">
        <section className="gs-auth-shell w-full rounded-[2.25rem] border border-red-200/35 bg-[#f8f8fb]/95">
          <div className="grid min-h-[620px] overflow-hidden rounded-[2.25rem] lg:grid-cols-2">
            <article
              className={`gs-auth-panel relative hidden items-center justify-center overflow-hidden px-10 text-center text-white lg:flex ${panelOnLeft ? "order-1 rounded-r-[7.5rem]" : "order-2 rounded-l-[7.5rem]"}`}
            >
              <div className="pointer-events-none absolute -left-20 -top-16 h-64 w-64 rounded-full border border-white/25 bg-white/10 blur-2xl gs-float" />
              <div className="pointer-events-none absolute -right-20 -bottom-20 h-72 w-72 rounded-full border border-white/20 bg-white/10 blur-2xl gs-float [animation-delay:700ms]" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_120%_at_10%_10%,rgba(255,255,255,0.24),transparent_45%),radial-gradient(80%_80%_at_95%_90%,rgba(248,113,113,0.22),transparent_60%)]" />
              <div className="relative max-w-sm space-y-4">
                <div className="gs-logo-card mx-auto w-full max-w-[330px] rounded-2xl border border-white/25 bg-white/10 p-3">
                  <Image
                    alt="GunSelf logo"
                    className="h-auto w-full rounded-xl"
                    height={260}
                    priority
                    src="/branding/gunself-logo.png"
                    width={460}
                  />
                </div>
                <h3 className="text-5xl font-bold tracking-tight">{panelTitle}</h3>
                <p className="text-base text-red-100/95">{panelText}</p>
                <Link
                  className="inline-flex rounded-xl border border-white/65 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/15"
                  href={panelButtonHref}
                >
                  {panelButtonLabel}
                </Link>
              </div>
            </article>

            <article className={`flex items-center px-8 py-10 lg:px-12 ${panelOnLeft ? "order-2" : "order-1"}`}>
              <div className="mx-auto w-full max-w-md">
                <div>
                  <h2 className="gs-display text-5xl font-bold tracking-tight text-slate-900">{title}</h2>
                  <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
                </div>

                <div className="mt-6">{children}</div>
                <div className="mt-6 border-t border-slate-200 pt-4 text-sm text-slate-600">{footer}</div>
              </div>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}
