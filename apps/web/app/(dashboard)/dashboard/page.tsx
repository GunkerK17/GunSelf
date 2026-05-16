"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { popLastAuthMethod } from "@/lib/guest-session";
import { supabase } from "@/lib/supabase/client";

type DashboardStats = {
  workoutCount: number;
  totalWorkoutMinutes: number;
  bodyLogCount: number;
  latestWeight: number | null;
  mealCountToday: number;
  caloriesToday: number;
};

function todayStartIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export default function DashboardPage() {
  const [welcome, setWelcome] = useState<string | null>(null);
  const [userLabel, setUserLabel] = useState("Athlete");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    workoutCount: 0,
    totalWorkoutMinutes: 0,
    bodyLogCount: 0,
    latestWeight: null,
    mealCountToday: 0,
    caloriesToday: 0
  });

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    const {
      data: { session }
    } = await supabase.auth.getSession();

    const userId = session?.user.id;
    const name = session?.user.user_metadata?.display_name;
    const email = session?.user.email;
    setUserLabel(name || email || "Guest Athlete");

    if (!userId) {
      setError("No active session.");
      setLoading(false);
      return;
    }

    const [workoutRes, bodyRes, latestBodyRes, todayMealsRes] = await Promise.all([
      supabase.from("workouts").select("duration_minutes", { count: "exact" }).eq("user_id", userId).order("logged_at", { ascending: false }).limit(300),
      supabase.from("body_logs").select("id", { count: "exact", head: true }).eq("user_id", userId),
      supabase.from("body_logs").select("weight_kg").eq("user_id", userId).order("logged_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("meals").select("calories", { count: "exact" }).eq("user_id", userId).gte("logged_at", todayStartIso()).limit(200)
    ]);

    const firstError = workoutRes.error || bodyRes.error || latestBodyRes.error || todayMealsRes.error;
    if (firstError) {
      setError(firstError.message);
      setLoading(false);
      return;
    }

    const totalWorkoutMinutes = (workoutRes.data ?? []).reduce((acc, row) => acc + (row.duration_minutes ?? 0), 0);
    const caloriesToday = (todayMealsRes.data ?? []).reduce((acc, row) => acc + (row.calories ?? 0), 0);

    setStats({
      workoutCount: workoutRes.count ?? workoutRes.data?.length ?? 0,
      totalWorkoutMinutes,
      bodyLogCount: bodyRes.count ?? 0,
      latestWeight: latestBodyRes.data?.weight_kg ?? null,
      mealCountToday: todayMealsRes.count ?? todayMealsRes.data?.length ?? 0,
      caloriesToday
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    const method = popLastAuthMethod();
    if (method) {
      const pretty = method === "register" ? "new account" : method;
      setWelcome(`Signed in successfully via ${pretty}.`);
    }

    void loadStats();
  }, [loadStats]);

  const todayFocus = useMemo(() => {
    return [
      `Workouts logged: ${stats.workoutCount}`,
      `Total workout minutes: ${stats.totalWorkoutMinutes}`,
      `Meals today: ${stats.mealCountToday}`
    ];
  }, [stats]);

  return (
    <section className="space-y-5">
      <div className="gs-client-hero gs-pulse-glow rounded-3xl p-6">
        <p className="inline-flex rounded-full border border-[#f28a24]/40 bg-[#f28a24]/18 px-3 py-1 text-xs font-medium text-orange-100">
          Phase 1 - Sprint 1
        </p>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Dashboard Control Room</h1>
        <p className="mt-2 text-cyan-100/85">Welcome, {userLabel}. Real metrics are connected now.</p>
        {welcome && <p className="mt-3 text-sm text-emerald-300">{welcome}</p>}
        {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="gs-client-panel gs-client-panel-3d gs-client-kpi rounded-2xl p-5">
          <p className="text-xs uppercase tracking-widest text-slate-500">Body</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{loading ? "--" : stats.latestWeight ? `${stats.latestWeight} kg` : "No data"}</p>
          <p className="mt-1 text-sm text-slate-600">Body logs: {loading ? "--" : stats.bodyLogCount}</p>
        </div>
        <div className="gs-client-panel gs-client-panel-3d gs-client-kpi rounded-2xl p-5 [animation-delay:320ms]">
          <p className="text-xs uppercase tracking-widest text-slate-500">Workout</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{loading ? "--" : stats.workoutCount}</p>
          <p className="mt-1 text-sm text-slate-600">Total minutes: {loading ? "--" : stats.totalWorkoutMinutes}</p>
        </div>
        <div className="gs-client-panel gs-client-panel-3d gs-client-kpi rounded-2xl p-5 [animation-delay:650ms]">
          <p className="text-xs uppercase tracking-widest text-slate-500">Nutrition</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{loading ? "--" : stats.mealCountToday}</p>
          <p className="mt-1 text-sm text-slate-600">Calories today: {loading ? "--" : stats.caloriesToday}</p>
        </div>
      </div>

      <div className="gs-client-panel gs-client-panel-3d rounded-2xl p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Today Focus</h2>
          <button
            className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700"
            onClick={() => void loadStats()}
            type="button"
          >
            Refresh
          </button>
        </div>
        <ul className="space-y-2 text-sm text-slate-600">
          {todayFocus.map((item) => (
            <li key={item}>- {item}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
