"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { Database } from "@gunself/types";

import { supabase } from "@/lib/supabase/client";

type Meal = Database["public"]["Tables"]["meals"]["Row"];

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

function todayStartIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export default function NutritionPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [items, setItems] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [form, setForm] = useState({
    mealType: "breakfast",
    title: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
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
      .from("meals")
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
    if (!form.title.trim()) {
      setError("Meal title is required.");
      return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);

    const { data, error: insertError } = await supabase
      .from("meals")
      .insert({
        user_id: userId,
        meal_type: form.mealType,
        title: form.title.trim(),
        calories: form.calories ? Number(form.calories) : null,
        protein_g: form.protein ? Number(form.protein) : null,
        carbs_g: form.carbs ? Number(form.carbs) : null,
        fat_g: form.fat ? Number(form.fat) : null,
        logged_at: new Date(form.loggedAt).toISOString()
      })
      .select("*")
      .single();

    if (insertError || !data) {
      setError(insertError?.message ?? "Create meal failed.");
      setSaving(false);
      return;
    }

    setItems((prev) => [data, ...prev]);
    setForm({
      mealType: "breakfast",
      title: "",
      calories: "",
      protein: "",
      carbs: "",
      fat: "",
      loggedAt: localDateTimeInputValue()
    });
    setSaving(false);
    setNotice("Meal saved.");
  }

  async function removeItem(item: Meal) {
    const confirmed = window.confirm(`Delete meal \"${item.title}\"?`);
    if (!confirmed) return;

    const { error: deleteError } = await supabase.from("meals").delete().eq("id", item.id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setItems((prev) => prev.filter((x) => x.id !== item.id));
    setNotice("Meal deleted.");
  }

  const summary = useMemo(() => {
    const todayMeals = items.filter((item) => item.logged_at && new Date(item.logged_at).toISOString() >= todayStartIso());
    return {
      totalToday: todayMeals.length,
      calories: todayMeals.reduce((acc, item) => acc + (item.calories ?? 0), 0),
      protein: todayMeals.reduce((acc, item) => acc + Number(item.protein_g ?? 0), 0),
      carbs: todayMeals.reduce((acc, item) => acc + Number(item.carbs_g ?? 0), 0),
      fat: todayMeals.reduce((acc, item) => acc + Number(item.fat_g ?? 0), 0)
    };
  }, [items]);

  return (
    <section className="space-y-4">
      <header className="gs-client-panel gs-client-panel-3d rounded-2xl p-6">
        <h1 className="text-2xl font-semibold text-[#0f172a]">Nutrition</h1>
        <p className="mt-2 text-slate-600">Track meals, calories and macros per day.</p>
      </header>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</div>}

      <div className="grid gap-3 md:grid-cols-5">
        <article className="gs-client-panel gs-client-panel-3d rounded-xl p-4">
          <p className="text-xs text-slate-500">Meals Today</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{summary.totalToday}</p>
        </article>
        <article className="gs-client-panel gs-client-panel-3d rounded-xl p-4">
          <p className="text-xs text-slate-500">Calories</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{summary.calories}</p>
        </article>
        <article className="gs-client-panel gs-client-panel-3d rounded-xl p-4">
          <p className="text-xs text-slate-500">Protein (g)</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{summary.protein.toFixed(1)}</p>
        </article>
        <article className="gs-client-panel gs-client-panel-3d rounded-xl p-4">
          <p className="text-xs text-slate-500">Carbs (g)</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{summary.carbs.toFixed(1)}</p>
        </article>
        <article className="gs-client-panel gs-client-panel-3d rounded-xl p-4">
          <p className="text-xs text-slate-500">Fat (g)</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{summary.fat.toFixed(1)}</p>
        </article>
      </div>

      <article className="gs-client-panel gs-client-panel-3d rounded-2xl p-4">
        <h2 className="mb-2 text-lg font-semibold text-slate-900">Add Meal</h2>
        <form className="grid gap-2 md:grid-cols-4" onSubmit={(event) => void handleSubmit(event)}>
          <select
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            onChange={(event) => setForm((prev) => ({ ...prev, mealType: event.target.value }))}
            value={form.mealType}
          >
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
            <option value="snack">Snack</option>
          </select>
          <input
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="Meal title"
            value={form.title}
          />
          <input
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            min={0}
            onChange={(event) => setForm((prev) => ({ ...prev, calories: event.target.value }))}
            placeholder="Calories"
            type="number"
            value={form.calories}
          />
          <input
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            onChange={(event) => setForm((prev) => ({ ...prev, loggedAt: event.target.value }))}
            type="datetime-local"
            value={form.loggedAt}
          />
          <input
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            min={0}
            onChange={(event) => setForm((prev) => ({ ...prev, protein: event.target.value }))}
            placeholder="Protein (g)"
            step="0.1"
            type="number"
            value={form.protein}
          />
          <input
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            min={0}
            onChange={(event) => setForm((prev) => ({ ...prev, carbs: event.target.value }))}
            placeholder="Carbs (g)"
            step="0.1"
            type="number"
            value={form.carbs}
          />
          <input
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            min={0}
            onChange={(event) => setForm((prev) => ({ ...prev, fat: event.target.value }))}
            placeholder="Fat (g)"
            step="0.1"
            type="number"
            value={form.fat}
          />
          <button
            className="rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
            disabled={saving}
            type="submit"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </form>
      </article>

      <article className="gs-client-panel gs-client-panel-3d rounded-2xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Recent Meals</h2>
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
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">No meals yet.</div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="gs-client-panel rounded-xl p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-600">
                      {item.meal_type ?? "meal"} | {formatDateTime(item.logged_at)} | {item.calories ?? 0} kcal
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                      P {Number(item.protein_g ?? 0).toFixed(1)}g / C {Number(item.carbs_g ?? 0).toFixed(1)}g / F {Number(item.fat_g ?? 0).toFixed(1)}g
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
