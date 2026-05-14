import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Login</h1>
        <p className="text-slate-600">Supabase auth base UI placeholder.</p>
      </div>

      <form className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <label className="mb-1 block text-sm text-slate-700">Email</label>
          <input className="w-full rounded-md border border-slate-300 px-3 py-2" type="email" placeholder="you@example.com" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-700">Password</label>
          <input className="w-full rounded-md border border-slate-300 px-3 py-2" type="password" placeholder="********" />
        </div>
        <button className="w-full rounded-md bg-brand-500 px-3 py-2 font-medium text-white" type="button">
          Sign in
        </button>
      </form>

      <p className="text-sm text-slate-600">
        No account? <Link className="text-brand-700 underline" href="/register">Register</Link>
      </p>
    </main>
  );
}
