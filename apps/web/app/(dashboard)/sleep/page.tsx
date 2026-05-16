"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { Database } from "@gunself/types";

import { supabase } from "@/lib/supabase/client";

type SleepLog = Database["public"]["Tables"]["sleep_logs"]["Row"];

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

function localDateTimeInputValue(date = new Date()) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function calcDurationMinutes(start: string, end: string) {
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();
  const diff = Math.round((endMs - startMs) / 60000);
  return Math.max(0, diff);
}

export default function SleepPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [items, setItems] = useState<SleepLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [form, setForm] = useState({
    sleepStart: localDateTimeInputValue(new Date(Date.now() - 8 * 60 * 60000)),
    sleepEnd: localDateTimeInputValue(),
    quality: ""
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
      .from("sleep_logs")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(90);

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

    const durationMinutes = calcDurationMinutes(form.sleepStart, form.sleepEnd);
    if (durationMinutes <= 0) {
      setError("Sleep end must be after sleep start.");
      return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);

    const { data, error: insertError } = await supabase
      .from("sleep_logs")
      .insert({
        user_id: userId,
        sleep_start: new Date(form.sleepStart).toISOString(),
        sleep_end: new Date(form.sleepEnd).toISOString(),
        duration_minutes: durationMinutes,
        quality_score: form.quality ? Number(form.quality) : null
      })
      .select("*")
      .single();

    if (insertError || !data) {
      setError(insertError?.message ?? "Create sleep log failed.");
      setSaving(false);
      return;
    }

    setItems((prev) => [data, ...prev]);
    setSaving(false);
    setNotice("Sleep log saved.");
  }

  async function removeItem(item: SleepLog) {
    const confirmed = window.confirm("Delete this sleep log?");
    if (!confirmed) return;

    const { error: deleteError } = await supabase.from("sleep_logs").delete().eq("id", item.id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setItems((prev) => prev.filter((x) => x.id !== item.id));
    setNotice("Sleep log deleted.");
  }

  const summary = useMemo(() => {
    const total = items.length;
    const totalMinutes = items.reduce((acc, item) => acc + (item.duration_minutes ?? 0), 0);
    const avgMinutes = total > 0 ? totalMinutes / total : 0;
    const avgQuality = total > 0 ? items.reduce((acc, item) => acc + Number(item.quality_score ?? 0), 0) / total : 0;
    return { total, totalMinutes, avgMinutes, avgQuality };
  }, [items]);

  return (
    <section className="space-y-4">
      <header className="gs-client-panel gs-client-panel-3d rounded-2xl p-6">
        <h1 className="text-2xl font-semibold text-[#0f172a]">Sleep</h1>
        <p className="mt-2 text-slate-600">Track sleep window, duration and quality score.</p>
      </header>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</div>}

      <div className="grid gap-3 md:grid-cols-4">
        <article className="gs-client-panel gs-client-panel-3d rounded-xl p-4">
          <p className="text-xs text-slate-500">Logs</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{summary.total}</p>
        </article>
        <article className="gs-client-panel gs-client-panel-3d rounded-xl p-4">
          <p className="text-xs text-slate-500">Total Minutes</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{summary.totalMinutes}</p>
        </article>
        <article className="gs-client-panel gs-client-panel-3d rounded-xl p-4">
          <p className="text-xs text-slate-500">Avg Duration</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{Math.round(summary.avgMinutes)} min</p>
        </article>
        <article className="gs-client-panel gs-client-panel-3d rounded-xl p-4">
          <p className="text-xs text-slate-500">Avg Quality</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{summary.avgQuality.toFixed(1)}/10</p>
        </article>
      </div>

      <article className="gs-client-panel gs-client-panel-3d rounded-2xl p-4">
        <h2 className="mb-2 text-lg font-semibold text-slate-900">Add Sleep Log</h2>
        <form className="grid gap-2 md:grid-cols-4" onSubmit={(event) => void handleSubmit(event)}>
          <input
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            onChange={(event) => setForm((prev) => ({ ...prev, sleepStart: event.target.value }))}
            type="datetime-local"
            value={form.sleepStart}
          />
          <input
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            onChange={(event) => setForm((prev) => ({ ...prev, sleepEnd: event.target.value }))}
            type="datetime-local"
            value={form.sleepEnd}
          />
          <input
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            max={10}
            min={1}
            onChange={(event) => setForm((prev) => ({ ...prev, quality: event.target.value }))}
            placeholder="Quality score 1-10"
            type="number"
            value={form.quality}
          />
          <button
            className="rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
            disabled={saving}
            type="submit"
          >
            {saving ? "Saving..." : "Save Sleep"}
          </button>
        </form>
      </article>

      <article className="gs-client-panel gs-client-panel-3d rounded-2xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Recent Sleep Logs</h2>
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
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">No sleep logs yet.</div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="gs-client-panel rounded-xl p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {item.duration_minutes ?? 0} min | Quality {item.quality_score ?? "-"}/10
                    </p>
                    <p className="text-xs text-slate-600">
                      {formatDateTime(item.sleep_start)} {"->"} {formatDateTime(item.sleep_end)}
                    </p>
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
