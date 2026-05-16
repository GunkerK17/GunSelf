"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { Database } from "@gunself/types";

import { supabase } from "@/lib/supabase/client";

type BodyLog = Database["public"]["Tables"]["body_logs"]["Row"];

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(value));
}

function localDateInputValue(date = new Date()) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 10);
}

export default function BodyPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [items, setItems] = useState<BodyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [form, setForm] = useState({
    weight: "",
    bodyFat: "",
    note: "",
    loggedAt: localDateInputValue()
  });

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);

    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session?.user.id) {
      setUserId(null);
      setItems([]);
      setError("Please login first.");
      setLoading(false);
      return;
    }

    setUserId(session.user.id);
    const { data, error: loadError } = await supabase
      .from("body_logs")
      .select("*")
      .eq("user_id", session.user.id)
      .order("logged_at", { ascending: false })
      .limit(100);

    if (loadError) {
      setError(loadError.message);
      setItems([]);
      setLoading(false);
      return;
    }

    setItems(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId) {
      setError("Please login first.");
      return;
    }

    if (!form.weight) {
      setError("Weight is required.");
      return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);

    const { data, error: insertError } = await supabase
      .from("body_logs")
      .insert({
        user_id: userId,
        weight_kg: Number(form.weight),
        body_fat_percent: form.bodyFat ? Number(form.bodyFat) : null,
        note: form.note.trim() || null,
        logged_at: new Date(form.loggedAt).toISOString()
      })
      .select("*")
      .single();

    if (insertError || !data) {
      setError(insertError?.message ?? "Create body log failed.");
      setSaving(false);
      return;
    }

    setItems((prev) => [data, ...prev]);
    setForm({
      weight: "",
      bodyFat: "",
      note: "",
      loggedAt: localDateInputValue()
    });
    setSaving(false);
    setNotice("Body log saved.");
  }

  async function removeItem(item: BodyLog) {
    const confirmed = window.confirm(`Delete body log on ${formatDate(item.logged_at)}?`);
    if (!confirmed) return;

    const { error: deleteError } = await supabase.from("body_logs").delete().eq("id", item.id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setItems((prev) => prev.filter((x) => x.id !== item.id));
    setNotice("Body log deleted.");
  }

  const summary = useMemo(() => {
    const latest = items[0] ?? null;
    const previous = items[1] ?? null;
    const delta = latest && previous && latest.weight_kg != null && previous.weight_kg != null ? latest.weight_kg - previous.weight_kg : null;
    return {
      totalLogs: items.length,
      latestWeight: latest?.weight_kg ?? null,
      latestBodyFat: latest?.body_fat_percent ?? null,
      weightDelta: delta
    };
  }, [items]);

  return (
    <section className="space-y-4">
      <header className="gs-client-panel gs-client-panel-3d rounded-2xl p-6">
        <h1 className="text-2xl font-semibold text-[#0f172a]">Body</h1>
        <p className="mt-2 text-slate-600">Track body metrics and progress over time.</p>
      </header>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</div>}

      <div className="grid gap-3 md:grid-cols-4">
        <article className="gs-client-panel gs-client-panel-3d rounded-xl p-4">
          <p className="text-xs text-slate-500">Logs</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{summary.totalLogs}</p>
        </article>
        <article className="gs-client-panel gs-client-panel-3d rounded-xl p-4">
          <p className="text-xs text-slate-500">Latest Weight</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{summary.latestWeight != null ? `${summary.latestWeight} kg` : "--"}</p>
        </article>
        <article className="gs-client-panel gs-client-panel-3d rounded-xl p-4">
          <p className="text-xs text-slate-500">Body Fat</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{summary.latestBodyFat != null ? `${summary.latestBodyFat}%` : "--"}</p>
        </article>
        <article className="gs-client-panel gs-client-panel-3d rounded-xl p-4">
          <p className="text-xs text-slate-500">Weight Delta</p>
          <p className={`mt-2 text-2xl font-bold ${summary.weightDelta != null && summary.weightDelta > 0 ? "text-rose-700" : "text-emerald-700"}`}>
            {summary.weightDelta != null ? `${summary.weightDelta > 0 ? "+" : ""}${summary.weightDelta.toFixed(1)} kg` : "--"}
          </p>
        </article>
      </div>

      <article className="gs-client-panel gs-client-panel-3d rounded-2xl p-4">
        <h2 className="mb-2 text-lg font-semibold text-slate-900">Add Body Log</h2>
        <form className="grid gap-2 md:grid-cols-5" onSubmit={(event) => void handleSubmit(event)}>
          <input
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            min={1}
            onChange={(event) => setForm((prev) => ({ ...prev, weight: event.target.value }))}
            placeholder="Weight (kg)"
            step="0.1"
            type="number"
            value={form.weight}
          />
          <input
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            min={0}
            onChange={(event) => setForm((prev) => ({ ...prev, bodyFat: event.target.value }))}
            placeholder="Body fat (%)"
            step="0.1"
            type="number"
            value={form.bodyFat}
          />
          <input
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            onChange={(event) => setForm((prev) => ({ ...prev, loggedAt: event.target.value }))}
            type="date"
            value={form.loggedAt}
          />
          <button
            className="rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
            disabled={saving}
            type="submit"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <div className="hidden md:block" />
          <textarea
            className="md:col-span-5 min-h-20 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
            placeholder="Note (optional)"
            value={form.note}
          />
        </form>
      </article>

      <article className="gs-client-panel gs-client-panel-3d rounded-2xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Recent Body Logs</h2>
          <button
            className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700"
            onClick={() => void loadItems()}
            type="button"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">Loading...</div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">No body logs yet.</div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="gs-client-panel rounded-xl p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {item.weight_kg ?? "--"} kg {item.body_fat_percent != null ? `| ${item.body_fat_percent}% fat` : ""}
                    </p>
                    <p className="text-xs text-slate-600">{formatDate(item.logged_at)}</p>
                    {item.note && <p className="mt-1 text-sm text-slate-700">{item.note}</p>}
                  </div>
                  <button
                    className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700"
                    onClick={() => void removeItem(item)}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}
