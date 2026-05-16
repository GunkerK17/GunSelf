"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { Database } from "@gunself/types";

import { supabase } from "@/lib/supabase/client";

type Goal = Database["public"]["Tables"]["goals"]["Row"];

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(value));
}

function getDueDateInput(value: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

function parseNumber(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function GoalsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [items, setItems] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    targetValue: "",
    currentValue: "",
    unit: "",
    dueDate: "",
    status: "active"
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
      .from("goals")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

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

    if (!form.title.trim()) {
      setError("Goal title is required.");
      return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);

    const { data, error: insertError } = await supabase
      .from("goals")
      .insert({
        user_id: userId,
        title: form.title.trim(),
        description: form.description.trim() || null,
        target_value: parseNumber(form.targetValue),
        current_value: parseNumber(form.currentValue),
        unit: form.unit.trim() || null,
        status: form.status,
        due_date: form.dueDate || null
      })
      .select("*")
      .single();

    if (insertError || !data) {
      setError(insertError?.message ?? "Create goal failed.");
      setSaving(false);
      return;
    }

    setItems((prev) => [data, ...prev]);
    setForm({
      title: "",
      description: "",
      targetValue: "",
      currentValue: "",
      unit: "",
      dueDate: "",
      status: "active"
    });
    setSaving(false);
    setNotice("Goal saved.");
  }

  async function updateGoal(item: Goal, patch: Partial<Goal>) {
    const { data, error: updateError } = await supabase.from("goals").update(patch).eq("id", item.id).select("*").single();

    if (updateError || !data) {
      setError(updateError?.message ?? "Update goal failed.");
      return;
    }

    setItems((prev) => prev.map((x) => (x.id === item.id ? data : x)));
    setNotice("Goal updated.");
  }

  async function removeItem(item: Goal) {
    const confirmed = window.confirm(`Delete goal \"${item.title}\"?`);
    if (!confirmed) return;

    const { error: deleteError } = await supabase.from("goals").delete().eq("id", item.id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setItems((prev) => prev.filter((x) => x.id !== item.id));
    setNotice("Goal deleted.");
  }

  const summary = useMemo(() => {
    const total = items.length;
    const completed = items.filter((item) => item.status === "completed").length;
    const active = items.filter((item) => item.status !== "completed").length;
    const avgProgress =
      total === 0
        ? 0
        : items.reduce((acc, item) => {
            const target = Number(item.target_value ?? 0);
            const current = Number(item.current_value ?? 0);
            if (target <= 0) return acc;
            return acc + Math.min(100, Math.max(0, (current / target) * 100));
          }, 0) / total;

    return { total, completed, active, avgProgress };
  }, [items]);

  return (
    <section className="space-y-4">
      <header className="gs-client-panel gs-client-panel-3d rounded-2xl p-6">
        <h1 className="text-2xl font-semibold text-[#0f172a]">Goals</h1>
        <p className="mt-2 text-slate-600">Set targets, track progress, and mark completed goals.</p>
      </header>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</div>}

      <div className="grid gap-3 md:grid-cols-4">
        <article className="gs-client-panel gs-client-panel-3d rounded-xl p-4">
          <p className="text-xs text-slate-500">Total Goals</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{summary.total}</p>
        </article>
        <article className="gs-client-panel gs-client-panel-3d rounded-xl p-4">
          <p className="text-xs text-slate-500">Active</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{summary.active}</p>
        </article>
        <article className="gs-client-panel gs-client-panel-3d rounded-xl p-4">
          <p className="text-xs text-slate-500">Completed</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{summary.completed}</p>
        </article>
        <article className="gs-client-panel gs-client-panel-3d rounded-xl p-4">
          <p className="text-xs text-slate-500">Avg Progress</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{summary.avgProgress.toFixed(0)}%</p>
        </article>
      </div>

      <article className="gs-client-panel gs-client-panel-3d rounded-2xl p-4">
        <h2 className="mb-2 text-lg font-semibold text-slate-900">Add Goal</h2>
        <form className="grid gap-2 md:grid-cols-6" onSubmit={(event) => void handleSubmit(event)}>
          <input
            className="md:col-span-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="Goal title"
            value={form.title}
          />
          <input
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            onChange={(event) => setForm((prev) => ({ ...prev, targetValue: event.target.value }))}
            placeholder="Target"
            type="number"
            value={form.targetValue}
          />
          <input
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            onChange={(event) => setForm((prev) => ({ ...prev, currentValue: event.target.value }))}
            placeholder="Current"
            type="number"
            value={form.currentValue}
          />
          <input
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            onChange={(event) => setForm((prev) => ({ ...prev, unit: event.target.value }))}
            placeholder="Unit (kg, km, ... )"
            value={form.unit}
          />
          <input
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            onChange={(event) => setForm((prev) => ({ ...prev, dueDate: event.target.value }))}
            type="date"
            value={form.dueDate}
          />
          <textarea
            className="md:col-span-4 min-h-20 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            placeholder="Description"
            value={form.description}
          />
          <select
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
            value={form.status}
          >
            <option value="active">Active</option>
            <option value="on-hold">On hold</option>
            <option value="completed">Completed</option>
          </select>
          <button
            className="rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
            disabled={saving}
            type="submit"
          >
            {saving ? "Saving..." : "Save Goal"}
          </button>
        </form>
      </article>

      <article className="gs-client-panel gs-client-panel-3d rounded-2xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Your Goals</h2>
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
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">No goals yet.</div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => {
              const target = Number(item.target_value ?? 0);
              const current = Number(item.current_value ?? 0);
              const progress = target > 0 ? Math.min(100, Math.max(0, (current / target) * 100)) : 0;

              return (
                <div key={item.id} className="gs-client-panel rounded-xl p-3">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-900">{item.title}</p>
                      {item.description && <p className="text-sm text-slate-700">{item.description}</p>}
                      <p className="text-xs text-slate-600">
                        {current}/{target || "-"} {item.unit ?? ""} | Due: {formatDate(item.due_date)}
                      </p>
                      <div className="h-2 w-full max-w-md rounded-full bg-slate-200">
                        <div className="h-2 rounded-full bg-gradient-to-r from-red-500 to-orange-400" style={{ width: `${progress}%` }} />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-semibold text-slate-800"
                        onChange={(event) => void updateGoal(item, { status: event.target.value })}
                        value={item.status ?? "active"}
                      >
                        <option value="active">Active</option>
                        <option value="on-hold">On hold</option>
                        <option value="completed">Completed</option>
                      </select>
                      <button
                        className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700"
                        onClick={() => {
                          const next = Number(item.current_value ?? 0) + 1;
                          void updateGoal(item, { current_value: next });
                        }}
                        type="button"
                      >
                        +1 progress
                      </button>
                      <button
                        className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700"
                        onClick={() => void removeItem(item)}
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </article>
    </section>
  );
}
