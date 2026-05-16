"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { Database } from "@gunself/types";

import { supabase } from "@/lib/supabase/client";

type Workout = Database["public"]["Tables"]["workouts"]["Row"];

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

export default function WorkoutPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [items, setItems] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    durationMinutes: "",
    caloriesBurned: "",
    note: "",
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
      .from("workouts")
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
    if (!form.name.trim()) {
      setError("Workout name is required.");
      return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);

    const { data, error: insertError } = await supabase
      .from("workouts")
      .insert({
        user_id: userId,
        name: form.name.trim(),
        duration_minutes: form.durationMinutes ? Number(form.durationMinutes) : null,
        calories_burned: form.caloriesBurned ? Number(form.caloriesBurned) : null,
        note: form.note.trim() || null,
        logged_at: new Date(form.loggedAt).toISOString()
      })
      .select("*")
      .single();

    if (insertError || !data) {
      setError(insertError?.message ?? "Create workout failed.");
      setSaving(false);
      return;
    }

    setItems((prev) => [data, ...prev]);
    setForm({
      name: "",
      durationMinutes: "",
      caloriesBurned: "",
      note: "",
      loggedAt: localDateTimeInputValue()
    });
    setSaving(false);
    setNotice("Workout saved.");
  }

  async function removeItem(item: Workout) {
    const confirmed = window.confirm(`Delete workout \"${item.name}\"?`);
    if (!confirmed) return;

    const { error: deleteError } = await supabase.from("workouts").delete().eq("id", item.id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setItems((prev) => prev.filter((x) => x.id !== item.id));
    setNotice("Workout deleted.");
  }

  const summary = useMemo(() => {
    const totalSessions = items.length;
    const totalMinutes = items.reduce((acc, item) => acc + (item.duration_minutes ?? 0), 0);
    const totalCalories = items.reduce((acc, item) => acc + (item.calories_burned ?? 0), 0);
    return { totalSessions, totalMinutes, totalCalories };
  }, [items]);

  return (
    <section className="space-y-4">
      <header className="gs-client-panel gs-client-panel-3d rounded-2xl p-6">
        <h1 className="text-2xl font-semibold text-[#0f172a]">Workout</h1>
        <p className="mt-2 text-slate-600">Log sessions, track duration and calories.</p>
      </header>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</div>}

      <div className="grid gap-3 md:grid-cols-3">
        <article className="gs-client-panel gs-client-panel-3d rounded-xl p-4">
          <p className="text-xs text-slate-500">Sessions</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{summary.totalSessions}</p>
        </article>
        <article className="gs-client-panel gs-client-panel-3d rounded-xl p-4">
          <p className="text-xs text-slate-500">Total Minutes</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{summary.totalMinutes}</p>
        </article>
        <article className="gs-client-panel gs-client-panel-3d rounded-xl p-4">
          <p className="text-xs text-slate-500">Calories Burned</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{summary.totalCalories}</p>
        </article>
      </div>

      <article className="gs-client-panel gs-client-panel-3d rounded-2xl p-4">
        <h2 className="mb-2 text-lg font-semibold text-slate-900">Add Workout</h2>
        <form className="grid gap-2 md:grid-cols-5" onSubmit={(event) => void handleSubmit(event)}>
          <input
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="Workout name"
            value={form.name}
          />
          <input
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            min={0}
            onChange={(event) => setForm((prev) => ({ ...prev, durationMinutes: event.target.value }))}
            placeholder="Minutes"
            type="number"
            value={form.durationMinutes}
          />
          <input
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            min={0}
            onChange={(event) => setForm((prev) => ({ ...prev, caloriesBurned: event.target.value }))}
            placeholder="Calories"
            type="number"
            value={form.caloriesBurned}
          />
          <input
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            onChange={(event) => setForm((prev) => ({ ...prev, loggedAt: event.target.value }))}
            type="datetime-local"
            value={form.loggedAt}
          />
          <button
            className="rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
            disabled={saving}
            type="submit"
          >
            {saving ? "Saving..." : "Save"}
          </button>
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
          <h2 className="text-lg font-semibold text-slate-900">Recent Workouts</h2>
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
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">No workouts yet.</div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="gs-client-panel rounded-xl p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-600">
                      {formatDateTime(item.logged_at)} | {item.duration_minutes ?? 0} min | {item.calories_burned ?? 0} kcal
                    </p>
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
