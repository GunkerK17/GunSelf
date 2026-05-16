"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { Database } from "@gunself/types";

import { supabase } from "@/lib/supabase/client";

type ActivityLog = Database["public"]["Tables"]["activity_logs"]["Row"];

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

export default function ActivityPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [items, setItems] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [form, setForm] = useState({
    activityType: "walking",
    durationMinutes: "",
    distanceKm: "",
    steps: "",
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
      .from("activity_logs")
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
      .from("activity_logs")
      .insert({
        user_id: userId,
        activity_type: form.activityType,
        duration_minutes: form.durationMinutes ? Number(form.durationMinutes) : null,
        distance_km: form.distanceKm ? Number(form.distanceKm) : null,
        steps: form.steps ? Number(form.steps) : null,
        logged_at: new Date(form.loggedAt).toISOString()
      })
      .select("*")
      .single();

    if (insertError || !data) {
      setError(insertError?.message ?? "Create activity failed.");
      setSaving(false);
      return;
    }

    setItems((prev) => [data, ...prev]);
    setForm({
      activityType: "walking",
      durationMinutes: "",
      distanceKm: "",
      steps: "",
      loggedAt: localDateTimeInputValue()
    });
    setSaving(false);
    setNotice("Activity saved.");
  }

  async function removeItem(item: ActivityLog) {
    const confirmed = window.confirm(`Delete activity ${item.activity_type}?`);
    if (!confirmed) return;

    const { error: deleteError } = await supabase.from("activity_logs").delete().eq("id", item.id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setItems((prev) => prev.filter((x) => x.id !== item.id));
    setNotice("Activity deleted.");
  }

  const summary = useMemo(() => {
    return {
      total: items.length,
      totalMinutes: items.reduce((acc, item) => acc + (item.duration_minutes ?? 0), 0),
      totalDistance: items.reduce((acc, item) => acc + Number(item.distance_km ?? 0), 0),
      totalSteps: items.reduce((acc, item) => acc + (item.steps ?? 0), 0)
    };
  }, [items]);

  return (
    <section className="space-y-4">
      <header className="gs-client-panel gs-client-panel-3d rounded-2xl p-6">
        <h1 className="text-2xl font-semibold text-[#0f172a]">Activity</h1>
        <p className="mt-2 text-slate-600">Track daily movement, sport time, distance and steps.</p>
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
          <p className="text-xs text-slate-500">Distance (km)</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{summary.totalDistance.toFixed(2)}</p>
        </article>
        <article className="gs-client-panel gs-client-panel-3d rounded-xl p-4">
          <p className="text-xs text-slate-500">Steps</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{summary.totalSteps}</p>
        </article>
      </div>

      <article className="gs-client-panel gs-client-panel-3d rounded-2xl p-4">
        <h2 className="mb-2 text-lg font-semibold text-slate-900">Add Activity</h2>
        <form className="grid gap-2 md:grid-cols-5" onSubmit={(event) => void handleSubmit(event)}>
          <select
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            onChange={(event) => setForm((prev) => ({ ...prev, activityType: event.target.value }))}
            value={form.activityType}
          >
            <option value="walking">Walking</option>
            <option value="running">Running</option>
            <option value="cycling">Cycling</option>
            <option value="football">Football</option>
            <option value="gym">Gym</option>
            <option value="other">Other</option>
          </select>
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
            onChange={(event) => setForm((prev) => ({ ...prev, distanceKm: event.target.value }))}
            placeholder="Distance km"
            step="0.01"
            type="number"
            value={form.distanceKm}
          />
          <input
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            min={0}
            onChange={(event) => setForm((prev) => ({ ...prev, steps: event.target.value }))}
            placeholder="Steps"
            type="number"
            value={form.steps}
          />
          <input
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            onChange={(event) => setForm((prev) => ({ ...prev, loggedAt: event.target.value }))}
            type="datetime-local"
            value={form.loggedAt}
          />
          <button
            className="md:col-span-5 rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
            disabled={saving}
            type="submit"
          >
            {saving ? "Saving..." : "Save Activity"}
          </button>
        </form>
      </article>

      <article className="gs-client-panel gs-client-panel-3d rounded-2xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Recent Activities</h2>
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
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">No activities yet.</div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="gs-client-panel rounded-xl p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{item.activity_type}</p>
                    <p className="text-xs text-slate-600">
                      {formatDateTime(item.logged_at)} | {item.duration_minutes ?? 0} min | {Number(item.distance_km ?? 0).toFixed(2)} km | {item.steps ?? 0} steps
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
