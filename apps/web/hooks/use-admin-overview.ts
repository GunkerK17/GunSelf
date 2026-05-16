"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { supabase } from "@/lib/supabase/client";

export type TimeWindowDays = 7 | 30 | 90;

type DailyWorkoutPoint = {
  date: string;
  workouts: number;
  meals: number;
};

type ModuleDistributionItem = {
  key: "workouts" | "meals" | "activity" | "sleep" | "mood" | "goals" | "skills" | "finance";
  count: number;
};

type TopActiveUserItem = {
  userId: string;
  name: string;
  workoutCount: number;
};

export type AdminOverviewStats = {
  totalUsers: number;
  activeUsers7d: number;
  totalWorkouts: number;
  totalMeals: number;
  publishedAnnouncements: number;
  workoutTrend: DailyWorkoutPoint[];
  workoutsThisWeek: number;
  workoutsLastWeek: number;
  mealsThisWeek: number;
  mealsLastWeek: number;
  moduleDistribution: ModuleDistributionItem[];
  topActiveUsers: TopActiveUserItem[];
};

const EMPTY_STATS: AdminOverviewStats = {
  totalUsers: 0,
  activeUsers7d: 0,
  totalWorkouts: 0,
  totalMeals: 0,
  publishedAnnouncements: 0,
  workoutTrend: [],
  workoutsThisWeek: 0,
  workoutsLastWeek: 0,
  mealsThisWeek: 0,
  mealsLastWeek: 0,
  moduleDistribution: [],
  topActiveUsers: []
};

function isMissingRelationError(message?: string | null) {
  return (message ?? "").toLowerCase().includes("does not exist");
}

function formatDayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function buildLastDays(dayCount: number) {
  const result: string[] = [];
  const now = new Date();

  for (let i = dayCount - 1; i >= 0; i -= 1) {
    const day = new Date(now);
    day.setDate(now.getDate() - i);
    result.push(formatDayKey(day));
  }

  return result;
}

function toDayLabel(dayKey: string) {
  const [, month, day] = dayKey.split("-");
  return `${day}/${month}`;
}

export function useAdminOverview(windowDays: TimeWindowDays = 7) {
  const [stats, setStats] = useState<AdminOverviewStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    const days = buildLastDays(windowDays);
    const days2Window = buildLastDays(windowDays * 2);
    const startDay2Window = `${days2Window[0]}T00:00:00.000Z`;
    const startDayWindow = `${days[0]}T00:00:00.000Z`;

    const [
      profilesRes,
      workoutsRes,
      mealsRes,
      announcementsRes,
      workouts2WindowRes,
      meals2WindowRes,
      activityCountRes,
      sleepCountRes,
      moodCountRes,
      goalsCountRes,
      skillsCountRes,
      financeCountRes
    ] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("workouts").select("id", { count: "exact", head: true }),
      supabase.from("meals").select("id", { count: "exact", head: true }),
      supabase.from("announcements").select("id", { count: "exact", head: true }).eq("is_published", true),
      supabase
        .from("workouts")
        .select("user_id,logged_at")
        .gte("logged_at", startDay2Window)
        .order("logged_at", { ascending: true })
        .limit(10000),
      supabase.from("meals").select("logged_at").gte("logged_at", startDay2Window).order("logged_at", { ascending: true }).limit(10000),
      supabase.from("activity_logs").select("id", { count: "exact", head: true }).gte("logged_at", startDayWindow),
      supabase.from("sleep_logs").select("id", { count: "exact", head: true }).gte("created_at", startDayWindow),
      supabase.from("mood_logs").select("id", { count: "exact", head: true }).gte("logged_at", startDayWindow),
      supabase.from("goals").select("id", { count: "exact", head: true }).gte("created_at", startDayWindow),
      supabase.from("skill_logs").select("id", { count: "exact", head: true }).gte("logged_at", startDayWindow),
      supabase.from("finance_logs").select("id", { count: "exact", head: true }).gte("logged_at", startDayWindow)
    ]);

    const firstError =
      profilesRes.error ||
      workoutsRes.error ||
      mealsRes.error ||
      workouts2WindowRes.error ||
      meals2WindowRes.error ||
      activityCountRes.error ||
      sleepCountRes.error ||
      moodCountRes.error ||
      goalsCountRes.error ||
      skillsCountRes.error ||
      financeCountRes.error;

    if (firstError) {
      setError(firstError.message);
      setStats(EMPTY_STATS);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (announcementsRes.error && !isMissingRelationError(announcementsRes.error.message)) {
      setError(announcementsRes.error.message);
      setStats(EMPTY_STATS);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const pointsMap = new Map<string, { workouts: number; meals: number }>(days.map((d) => [d, { workouts: 0, meals: 0 }]));
    const activeUsers = new Set<string>();
    const currentWeekSet = new Set(days);
    const previousWeekSet = new Set(days2Window.slice(0, windowDays));

    let workoutsThisWeek = 0;
    let workoutsLastWeek = 0;
    let mealsThisWeek = 0;
    let mealsLastWeek = 0;
    const workoutByUser = new Map<string, number>();

    for (const row of workouts2WindowRes.data ?? []) {
      const dayKey = row.logged_at?.slice(0, 10);
      if (!dayKey) {
        continue;
      }

      if (pointsMap.has(dayKey)) {
        const current = pointsMap.get(dayKey);
        if (current) {
          current.workouts += 1;
        }
      }

      if (currentWeekSet.has(dayKey)) {
        workoutsThisWeek += 1;
      } else if (previousWeekSet.has(dayKey)) {
        workoutsLastWeek += 1;
      }

      if (row.user_id && currentWeekSet.has(dayKey)) {
        activeUsers.add(row.user_id);
        workoutByUser.set(row.user_id, (workoutByUser.get(row.user_id) ?? 0) + 1);
      }
    }

    for (const row of meals2WindowRes.data ?? []) {
      const dayKey = row.logged_at?.slice(0, 10);
      if (!dayKey) {
        continue;
      }

      if (pointsMap.has(dayKey)) {
        const current = pointsMap.get(dayKey);
        if (current) {
          current.meals += 1;
        }
      }

      if (currentWeekSet.has(dayKey)) {
        mealsThisWeek += 1;
      } else if (previousWeekSet.has(dayKey)) {
        mealsLastWeek += 1;
      }
    }

    const topUsersRaw = [...workoutByUser.entries()]
      .map(([userId, workoutCount]) => ({ userId, workoutCount }))
      .sort((a, b) => b.workoutCount - a.workoutCount)
      .slice(0, 5);

    let topActiveUsers: TopActiveUserItem[] = [];
    if (topUsersRaw.length > 0) {
      const ids = topUsersRaw.map((item) => item.userId);
      const { data: profileRows } = await supabase.from("profiles").select("id,display_name").in("id", ids);
      const profileMap = new Map((profileRows ?? []).map((row) => [row.id, row.display_name]));

      topActiveUsers = topUsersRaw.map((item) => ({
        userId: item.userId,
        name: profileMap.get(item.userId) || item.userId.slice(0, 8),
        workoutCount: item.workoutCount
      }));
    }

    const nextStats: AdminOverviewStats = {
      totalUsers: profilesRes.count ?? 0,
      activeUsers7d: activeUsers.size,
      totalWorkouts: workoutsRes.count ?? 0,
      totalMeals: mealsRes.count ?? 0,
      publishedAnnouncements: announcementsRes.error ? 0 : announcementsRes.count ?? 0,
      workoutTrend: days.map((dayKey) => ({
        date: toDayLabel(dayKey),
        workouts: pointsMap.get(dayKey)?.workouts ?? 0,
        meals: pointsMap.get(dayKey)?.meals ?? 0
      })),
      workoutsThisWeek,
      workoutsLastWeek,
      mealsThisWeek,
      mealsLastWeek,
      moduleDistribution: [
        { key: "workouts", count: workoutsThisWeek },
        { key: "meals", count: mealsThisWeek },
        { key: "activity", count: activityCountRes.count ?? 0 },
        { key: "sleep", count: sleepCountRes.count ?? 0 },
        { key: "mood", count: moodCountRes.count ?? 0 },
        { key: "goals", count: goalsCountRes.count ?? 0 },
        { key: "skills", count: skillsCountRes.count ?? 0 },
        { key: "finance", count: financeCountRes.count ?? 0 }
      ],
      topActiveUsers
    };

    setStats(nextStats);
    setLoading(false);
    setRefreshing(false);
  }, [windowDays]);

  useEffect(() => {
    void load();
  }, [load]);

  const maxTrendCount = useMemo(() => {
    if (stats.workoutTrend.length === 0) {
      return 1;
    }
    return Math.max(...stats.workoutTrend.map((item) => Math.max(item.workouts, item.meals)), 1);
  }, [stats.workoutTrend]);

  return {
    stats,
    loading,
    refreshing,
    error,
    maxTrendCount,
    refresh: () => load(true)
  };
}
