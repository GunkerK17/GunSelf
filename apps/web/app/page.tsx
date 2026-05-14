import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-4xl font-bold text-slate-900">GunSelf</h1>
      <p className="max-w-2xl text-slate-600">Personal Life Operating System for body, training, nutrition, sleep, mood, goals and more.</p>
      <div className="flex gap-3">
        <Link className="rounded-md bg-brand-500 px-4 py-2 text-white" href="/login">
          Login
        </Link>
        <Link className="rounded-md border border-slate-300 px-4 py-2 text-slate-700" href="/register">
          Register
        </Link>
        <Link className="rounded-md border border-slate-300 px-4 py-2 text-slate-700" href="/dashboard">
          Dashboard
        </Link>
      </div>
    </main>
  );
}
