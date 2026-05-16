"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { Database } from "@gunself/types";

import { supabase } from "@/lib/supabase/client";

type MoodLog = Database["public"]["Tables"]["mood_logs"]["Row"];

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

export default function MoodPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [items, setItems] = useState<MoodLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [form, setForm] = useState({
    moodScore: "",
    energyScore: "",
    stressScore: "",
    journal: "",
    loggedAt: localDateTimeInputValue()
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
      .from("mood_logs")
      .select("*")
      .eq("user_id", session.user.id)
      .order("logged_at", { ascending: false })
      .limit(120);

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

    setSaving(true);
    setError(null);
    setNotice(null);

    const { data, error: insertError } = await supabase
      .from("mood_logs")
      .insert({
        user_id: userId,
        mood_score: form.moodScore ? Number(form.moodScore) : null,
        energy_score: form.energyScore ? Number(form.energyScore) : null,
        stress_score: form.stressScore ? Number(form.stressScore) : null,
        journal_note: form.journal.trim() || null,
        logged_at: new Date(form.loggedAt).toISOString()
      })
      .select("*")
      .single();

    if (insertError || !data) {
      setError(insertError?.message ?? "Create mood log failed.");
      setSaving(false);
      return;
    }

    setItems((prev) => [data, ...prev]);
    setForm({
      moodScore: "",
      energyScore: "",
      stressScore: "",
      journal: "",
      loggedAt: localDateTimeInputValue()
    });
    setSaving(false);
    setNotice("Mood log saved.");
  }

  async function removeItem(item: MoodLog) {
    const confirmed = window.confirm("Delete this mood log?");
    if (!confirmed) return;

    const { error: deleteError } = await supabase.from("mood_logs").delete().eq("id", item.id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setItems((prev) => prev.filter((x) => x.id !== item.id));
    setNotice("Mood log deleted.");
  }

  const summary = useMemo(() => {
    const total = items.length;
    const avgMood = total > 0 ? items.reduce((acc, item) => acc + Number(item.mood_score ?? 0), 0) / total : 0;
    const avgEnergy = total > 0 ? items.reduce((acc, item) => acc + Number(item.energy_score ?? 0), 0) / total : 0;
    const avgStress = total > 0 ? items.reduce((acc, item) => acc + Number(item.stress_score ?? 0), 0) / total : 0;
    return { total, avgMood, avgEnergy, avgStress };
  }, [items]);

  return (
    <section className="space-y-4">
      <header className="gs-client-panel gs-client-panel-3d rounded-2xl p-6">
        <h1 className="text-2xl font-semibold text-[#0f172a]">Mood</h1>
        <p className="mt-2 text-slate-600">Track mood, energy, stress and short journal notes.</p>
      </header>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</div>}

      <div className="grid gap-3 md:grid-cols-4">
        <article className="gs-client-panel gs-client-panel-3d rounded-xl p-4">
          <p className="text-xs text-slate-500">Logs</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{summary.total}</p>
        </article>
        <article className="gs-client-panel gs-client-panel-3d rounded-xl p-4">
          <p className="text-xs text-slate-500">Avg Mood</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{summary.avgMood.toFixed(1)}/10</p>
        </article>
        <article className="gs-client-panel gs-client-panel-3d rounded-xl p-4">
          <p className="text-xs text-slate-500">Avg Energy</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{summary.avgEnergy.toFixed(1)}/10</p>
        </article>
        <article className="gs-client-panel gs-client-panel-3d rounded-xl p-4">
          <p className="text-xs text-slate-500">Avg Stress</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{summary.avgStress.toFixed(1)}/10</p>
        </article>
      </div>

      <article className="gs-client-panel gs-client-panel-3d rounded-2xl p-4">
        <h2 className="mb-2 text-lg font-semibold text-slate-900">Add Mood Log</h2>
        <form className="grid gap-2 md:grid-cols-4" onSubmit={(event) => void handleSubmit(event)}>
          <input
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            max={10}
            min={1}
            onChange={(event) => setForm((prev) => ({ ...prev, moodScore: event.target.value }))}
            placeholder="Mood 1-10"
            type="number"
            value={form.moodScore}
          />
          <input
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            max={10}
            min={1}
            onChange={(event) => setForm((prev) => ({ ...prev, energyScore: event.target.value }))}
            placeholder="Energy 1-10"
            type="number"
            value={form.energyScore}
          />
          <input
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            max={10}
            min={1}
            onChange={(event) => setForm((prev) => ({ ...prev, stressScore: event.target.value }))}
            placeholder="Stress 1-10"
            type="number"
            value={form.stressScore}
          />
          <input
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            onChange={(event) => setForm((prev) => ({ ...prev, loggedAt: event.target.value }))}
            type="datetime-local"
            value={form.loggedAt}
          />
          <textarea
            className="md:col-span-4 min-h-20 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            onChange={(event) => setForm((prev) => ({ ...prev, journal: event.target.value }))}
            placeholder="Journal note"
            value={form.journal}
          />
          <button
            className="md:col-span-4 rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
            disabled={saving}
            type="submit"
          >
            {saving ? "Saving..." : "Save Mood"}
          </button>
        </form>
      </article>

      <article className="gs-client-panel gs-client-panel-3d rounded-2xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Recent Mood Logs</h2>
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
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">No mood logs yet.</div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="gs-client-panel rounded-xl p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">
                      Mood {item.mood_score ?? "-"} / Energy {item.energy_score ?? "-"} / Stress {item.stress_score ?? "-"}
                    </p>
                    <p className="text-xs text-slate-600">{formatDateTime(item.logged_at)}</p>
                    {item.journal_note && <p className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">{item.journal_note}</p>}
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
