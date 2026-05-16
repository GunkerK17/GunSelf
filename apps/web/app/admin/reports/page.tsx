"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Database } from "@gunself/types";

import { supabase } from "@/lib/supabase/client";

type Range = "7d" | "30d" | "90d";

type MetricCards = {
  users: number;
  workouts: number;
  meals: number;
  sleepLogs: number;
  moodLogs: number;
  goals: number;
  financeLogs: number;
  activeUsers: number;
};

type TimelinePoint = {
  date: string;
  workouts: number;
  meals: number;
  moods: number;
};

type WorkoutRow = Database["public"]["Tables"]["workouts"]["Row"];
type MealRow = Database["public"]["Tables"]["meals"]["Row"];
type MoodRow = Database["public"]["Tables"]["mood_logs"]["Row"];

type TrendPoint = {
  label: string;
  workouts: number;
  meals: number;
  moods: number;
};

function getDays(range: Range) {
  if (range === "7d") return 7;
  if (range === "30d") return 30;
  return 90;
}

function rangeStartIso(days: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - (days - 1));
  return date.toISOString();
}

function dateKey(value: string | null) {
  if (!value) {
    return "";
  }
  return new Date(value).toISOString().slice(0, 10);
}

function buildTimeline(days: number, workouts: WorkoutRow[], meals: MealRow[], moods: MoodRow[]): TimelinePoint[] {
  const map = new Map<string, TimelinePoint>();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));

  for (let i = 0; i < days; i += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const key = date.toISOString().slice(0, 10);
    map.set(key, { date: key, workouts: 0, meals: 0, moods: 0 });
  }

  workouts.forEach((item) => {
    const key = dateKey(item.logged_at);
    const current = map.get(key);
    if (current) current.workouts += 1;
  });

  meals.forEach((item) => {
    const key = dateKey(item.logged_at);
    const current = map.get(key);
    if (current) current.meals += 1;
  });

  moods.forEach((item) => {
    const key = dateKey(item.logged_at);
    const current = map.get(key);
    if (current) current.moods += 1;
  });

  return Array.from(map.values());
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const height = max <= 0 ? 4 : Math.max(6, Math.round((value / max) * 100));
  return <div className={`w-2 rounded-full ${color}`} style={{ height: `${height}%` }} title={`${value}`} />;
}

export default function AdminReportsPage() {
  const [range, setRange] = useState<Range>("30d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cards, setCards] = useState<MetricCards>({
    users: 0,
    workouts: 0,
    meals: 0,
    sleepLogs: 0,
    moodLogs: 0,
    goals: 0,
    financeLogs: 0,
    activeUsers: 0
  });
  const [timeline, setTimeline] = useState<TimelinePoint[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const days = getDays(range);
    const startIso = rangeStartIso(days);

    const [
      usersRes,
      workoutsCountRes,
      mealsCountRes,
      sleepCountRes,
      moodCountRes,
      goalsCountRes,
      financeCountRes,
      workoutsRowsRes,
      mealsRowsRes,
      moodsRowsRes,
      activityUsersRes
    ] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("workouts").select("id", { count: "exact", head: true }).gte("logged_at", startIso),
      supabase.from("meals").select("id", { count: "exact", head: true }).gte("logged_at", startIso),
      supabase.from("sleep_logs").select("id", { count: "exact", head: true }).gte("created_at", startIso),
      supabase.from("mood_logs").select("id", { count: "exact", head: true }).gte("logged_at", startIso),
      supabase.from("goals").select("id", { count: "exact", head: true }).gte("created_at", startIso),
      supabase.from("finance_logs").select("id", { count: "exact", head: true }).gte("logged_at", startIso),
      supabase.from("workouts").select("id,logged_at,user_id").gte("logged_at", startIso).limit(4000),
      supabase.from("meals").select("id,logged_at,user_id").gte("logged_at", startIso).limit(4000),
      supabase.from("mood_logs").select("id,logged_at,user_id").gte("logged_at", startIso).limit(4000),
      supabase.from("activity_logs").select("user_id,logged_at").gte("logged_at", startIso).limit(4000)
    ]);

    const firstError =
      usersRes.error ||
      workoutsCountRes.error ||
      mealsCountRes.error ||
      sleepCountRes.error ||
      moodCountRes.error ||
      goalsCountRes.error ||
      financeCountRes.error ||
      workoutsRowsRes.error ||
      mealsRowsRes.error ||
      moodsRowsRes.error ||
      activityUsersRes.error;

    if (firstError) {
      setError(firstError.message);
      setLoading(false);
      return;
    }

    const activeSet = new Set<string>();
    (workoutsRowsRes.data ?? []).forEach((x) => x.user_id && activeSet.add(x.user_id));
    (mealsRowsRes.data ?? []).forEach((x) => x.user_id && activeSet.add(x.user_id));
    (moodsRowsRes.data ?? []).forEach((x) => x.user_id && activeSet.add(x.user_id));
    (activityUsersRes.data ?? []).forEach((x) => x.user_id && activeSet.add(x.user_id));

    setCards({
      users: usersRes.count ?? 0,
      workouts: workoutsCountRes.count ?? 0,
      meals: mealsCountRes.count ?? 0,
      sleepLogs: sleepCountRes.count ?? 0,
      moodLogs: moodCountRes.count ?? 0,
      goals: goalsCountRes.count ?? 0,
      financeLogs: financeCountRes.count ?? 0,
      activeUsers: activeSet.size
    });

    setTimeline(
      buildTimeline(
        days,
        (workoutsRowsRes.data ?? []) as WorkoutRow[],
        (mealsRowsRes.data ?? []) as MealRow[],
        (moodsRowsRes.data ?? []) as MoodRow[]
      )
    );

    setLoading(false);
  }, [range]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const trend = useMemo<TrendPoint[]>(() => {
    return timeline.map((point) => ({
      label: point.date.slice(5),
      workouts: point.workouts,
      meals: point.meals,
      moods: point.moods
    }));
  }, [timeline]);

  const maxValue = useMemo(() => {
    return trend.reduce((acc, item) => Math.max(acc, item.workouts, item.meals, item.moods), 0);
  }, [trend]);

  return (
    <section className="space-y-4">
      <header className="gs-admin-tile rounded-3xl border border-slate-300 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Reports & Analytics</h1>
            <p className="mt-1 text-sm text-slate-600">Live metrics from Supabase for operations and product tracking.</p>
          </div>
          <div className="flex gap-2">
            {(["7d", "30d", "90d"] as Range[]).map((item) => (
              <button
                key={item}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                  range === item ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-700"
                }`}
                onClick={() => setRange(item)}
                type="button"
              >
                {item.toUpperCase()}
              </button>
            ))}
            <button
              className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700"
              onClick={() => void loadData()}
              type="button"
            >
              Refresh
            </button>
          </div>
        </div>
      </header>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article className="gs-admin-tile rounded-2xl border border-slate-300 bg-white p-4">
          <p className="text-sm text-slate-500">Total Users</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">{cards.users}</p>
        </article>
        <article className="gs-admin-tile rounded-2xl border border-slate-300 bg-white p-4">
          <p className="text-sm text-slate-500">Active Users ({range.toUpperCase()})</p>
          <p className="mt-2 text-3xl font-extrabold text-emerald-700">{cards.activeUsers}</p>
        </article>
        <article className="gs-admin-tile rounded-2xl border border-slate-300 bg-white p-4">
          <p className="text-sm text-slate-500">Workouts</p>
          <p className="mt-2 text-3xl font-extrabold text-rose-700">{cards.workouts}</p>
        </article>
        <article className="gs-admin-tile rounded-2xl border border-slate-300 bg-white p-4">
          <p className="text-sm text-slate-500">Meals</p>
          <p className="mt-2 text-3xl font-extrabold text-blue-700">{cards.meals}</p>
        </article>
      </div>

      <div className="grid gap-3 lg:grid-cols-[2fr_1fr]">
        <article className="gs-admin-tile rounded-2xl border border-slate-300 bg-white p-4">
          <h2 className="text-lg font-semibold text-slate-900">Daily Trend ({range.toUpperCase()})</h2>
          <p className="mt-1 text-sm text-slate-600">Workouts (red), Meals (blue), Mood logs (green)</p>
          {loading ? (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-8 text-center text-sm text-slate-500">Loading...</div>
          ) : trend.length === 0 ? (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-8 text-center text-sm text-slate-500">No data in range.</div>
          ) : (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex h-44 items-end gap-1 overflow-x-auto">
                {trend.map((point) => (
                  <div key={point.label} className="flex min-w-6 flex-col items-center gap-1">
                    <div className="flex h-36 items-end gap-[2px]">
                      <Bar color="bg-rose-500" max={maxValue} value={point.workouts} />
                      <Bar color="bg-blue-500" max={maxValue} value={point.meals} />
                      <Bar color="bg-emerald-500" max={maxValue} value={point.moods} />
                    </div>
                    <span className="text-[10px] text-slate-500">{point.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </article>

        <article className="gs-admin-tile rounded-2xl border border-slate-300 bg-white p-4">
          <h2 className="text-lg font-semibold text-slate-900">Module Counters</h2>
          <div className="mt-3 space-y-2 text-sm">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">Sleep logs: <span className="font-semibold">{cards.sleepLogs}</span></div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">Mood logs: <span className="font-semibold">{cards.moodLogs}</span></div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">Goals: <span className="font-semibold">{cards.goals}</span></div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">Finance logs: <span className="font-semibold">{cards.financeLogs}</span></div>
          </div>
        </article>
      </div>
    </section>
  );
}
