"use client";

import { useMemo, useState } from "react";

import { useLanguage } from "@/components/providers/language-provider";
import { type TimeWindowDays, useAdminOverview } from "@/hooks/use-admin-overview";

const MODULE_COLORS = {
  workouts: "#dc2626",
  meals: "#334155",
  activity: "#0ea5e9",
  sleep: "#6366f1",
  mood: "#a855f7",
  goals: "#f59e0b",
  skills: "#16a34a",
  finance: "#111827"
} as const;

function formatNumber(value: number) {
  return new Intl.NumberFormat().format(value);
}

function percentChange(current: number, previous: number) {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
}

function ChangePill({ value }: { value: number }) {
  const positive = value >= 0;
  const text = `${positive ? "+" : ""}${value.toFixed(1)}%`;

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        positive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
      }`}
    >
      {text}
    </span>
  );
}

function buildLinePath(values: number[], width: number, height: number, max: number) {
  if (values.length === 0) {
    return "";
  }

  const safeMax = Math.max(max, 1);
  const stepX = values.length > 1 ? width / (values.length - 1) : 0;

  return values
    .map((value, index) => {
      const x = index * stepX;
      const y = height - (value / safeMax) * height;
      return `${index === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");
}

function buildAreaPath(values: number[], width: number, height: number, max: number) {
  if (values.length === 0) {
    return "";
  }

  const safeMax = Math.max(max, 1);
  const stepX = values.length > 1 ? width / (values.length - 1) : 0;
  const line = values
    .map((value, index) => {
      const x = index * stepX;
      const y = height - (value / safeMax) * height;
      return `${index === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");

  const endX = (values.length - 1) * stepX;
  return `${line} L${endX},${height} L0,${height} Z`;
}

export default function AdminOverviewPage() {
  const { t } = useLanguage();
  const [windowDays, setWindowDays] = useState<TimeWindowDays>(7);
  const { stats, loading, error, refresh, refreshing } = useAdminOverview(windowDays);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const workoutDelta = percentChange(stats.workoutsThisWeek, stats.workoutsLastWeek);
  const mealDelta = percentChange(stats.mealsThisWeek, stats.mealsLastWeek);
  const selectedIndex = hoveredIndex ?? Math.max(stats.workoutTrend.length - 1, 0);
  const selectedPoint = stats.workoutTrend[selectedIndex];
  const filterOptions: Array<{ value: TimeWindowDays; label: string }> = [
    { value: 7, label: t.adminOverview.filters.days7 },
    { value: 30, label: t.adminOverview.filters.days30 },
    { value: 90, label: t.adminOverview.filters.days90 }
  ];

  const distribution = useMemo(() => {
    const items = stats.moduleDistribution.filter((item) => item.count > 0);
    const total = items.reduce((acc, item) => acc + item.count, 0);
    if (total === 0) {
      return { total: 0, gradient: "conic-gradient(#e5e7eb 0deg 360deg)", rows: [] as typeof items };
    }

    let offset = 0;
    const segments: string[] = [];
    for (const item of items) {
      const angle = (item.count / total) * 360;
      const start = offset;
      const end = offset + angle;
      segments.push(`${MODULE_COLORS[item.key]} ${start}deg ${end}deg`);
      offset = end;
    }

    return { total, gradient: `conic-gradient(${segments.join(", ")})`, rows: items };
  }, [stats.moduleDistribution]);

  const chart = useMemo(() => {
    const width = 640;
    const height = 230;
    const valuesWorkout = stats.workoutTrend.map((p) => p.workouts);
    const valuesMeal = stats.workoutTrend.map((p) => p.meals);
    const max = Math.max(1, ...valuesWorkout, ...valuesMeal);
    const stepX = stats.workoutTrend.length > 1 ? width / (stats.workoutTrend.length - 1) : 0;

    return {
      width,
      height,
      max,
      stepX,
      lineWorkout: buildLinePath(valuesWorkout, width, height, max),
      lineMeal: buildLinePath(valuesMeal, width, height, max),
      areaWorkout: buildAreaPath(valuesWorkout, width, height, max),
      areaMeal: buildAreaPath(valuesMeal, width, height, max)
    };
  }, [stats.workoutTrend]);

  return (
    <section className="space-y-5">
      <header className="gs-admin-tile rounded-3xl border border-slate-300 bg-white p-5 shadow-[0_20px_38px_-28px_rgba(15,23,42,0.42)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-[#b91c1c]">{t.adminOverview.badge}</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t.adminOverview.title}</h1>
            <p className="mt-1 text-sm text-slate-600">{t.adminOverview.subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-xl border border-slate-300 bg-slate-100 p-1">
              {filterOptions.map((option) => {
                const active = windowDays === option.value;
                return (
                  <button
                    key={option.value}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-200"
                    }`}
                    onClick={() => setWindowDays(option.value)}
                    type="button"
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            <button
              className="rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
              disabled={refreshing}
              onClick={refresh}
              type="button"
            >
              {refreshing ? t.common.loading : t.adminOverview.mode}
            </button>
          </div>
        </div>
      </header>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article className="gs-admin-tile gs-admin-card-pop rounded-2xl border border-slate-300 bg-gradient-to-br from-white to-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-600">{t.adminOverview.summaryCards[0]}</p>
          <p className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900">{loading ? "--" : formatNumber(stats.totalUsers)}</p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{t.adminOverview.connectHint}</p>
        </article>

        <article className="gs-admin-tile gs-admin-card-pop rounded-2xl border border-slate-300 bg-gradient-to-br from-white to-slate-50 p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-600">{t.adminOverview.summaryCards[1]}</p>
            {!loading && <ChangePill value={workoutDelta} />}
          </div>
          <p className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900">{loading ? "--" : formatNumber(stats.activeUsers7d)}</p>
          <p className="mt-2 text-xs font-medium text-slate-500">
            {t.adminOverview.thisWeek}: {loading ? "--" : formatNumber(stats.workoutsThisWeek)} / {t.adminOverview.lastWeek}:{" "}
            {loading ? "--" : formatNumber(stats.workoutsLastWeek)}
          </p>
        </article>

        <article className="gs-admin-tile gs-admin-card-pop rounded-2xl border border-slate-300 bg-gradient-to-br from-white to-slate-50 p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-600">{t.adminOverview.summaryCards[2]}</p>
            {!loading && <ChangePill value={workoutDelta} />}
          </div>
          <p className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900">{loading ? "--" : formatNumber(stats.totalWorkouts)}</p>
          <p className="mt-2 text-xs font-medium text-slate-500">
            {t.adminOverview.thisWeek}: {loading ? "--" : formatNumber(stats.workoutsThisWeek)} / {t.adminOverview.lastWeek}:{" "}
            {loading ? "--" : formatNumber(stats.workoutsLastWeek)}
          </p>
        </article>

        <article className="gs-admin-tile gs-admin-card-pop rounded-2xl border border-slate-300 bg-gradient-to-br from-white to-slate-50 p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-600">{t.adminOverview.summaryCards[3]}</p>
            {!loading && <ChangePill value={mealDelta} />}
          </div>
          <p className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900">{loading ? "--" : formatNumber(stats.totalMeals)}</p>
          <p className="mt-2 text-xs font-medium text-slate-500">
            {t.adminOverview.thisWeek}: {loading ? "--" : formatNumber(stats.mealsThisWeek)} / {t.adminOverview.lastWeek}:{" "}
            {loading ? "--" : formatNumber(stats.mealsLastWeek)}
          </p>
        </article>
      </div>

      {error && (
        <article className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {t.adminOverview.errorPrefix}: {error}
        </article>
      )}

      <div className="grid gap-3 xl:grid-cols-[1.7fr_1fr]">
        <article className="gs-admin-tile rounded-2xl border border-slate-300 bg-white p-4 shadow-[0_16px_34px_-28px_rgba(15,23,42,0.4)]">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">{t.adminOverview.trendTitle}</h2>
            <span className="rounded-lg border border-slate-300 bg-slate-100 px-2 py-1 text-xs text-slate-700">
              {t.adminOverview.trendState}
            </span>
          </div>
          {stats.workoutTrend.length === 0 ? (
            <div className="grid h-56 place-items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-center">
              <div>
                <p className="text-sm font-medium text-slate-700">{t.adminOverview.noChart}</p>
                <p className="mt-1 text-xs text-slate-500">{t.adminOverview.noChartHint}</p>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center gap-4 text-xs">
                <span className="inline-flex items-center gap-2 text-slate-700">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-600" />
                  {t.adminOverview.workoutSeries}
                </span>
                <span className="inline-flex items-center gap-2 text-slate-700">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
                  {t.adminOverview.mealSeries}
                </span>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <svg className="h-56 w-full" viewBox={`0 0 ${chart.width} ${chart.height}`} preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="workoutArea" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity="0.03" />
                    </linearGradient>
                    <linearGradient id="mealArea" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#334155" stopOpacity="0.32" />
                      <stop offset="100%" stopColor="#334155" stopOpacity="0.03" />
                    </linearGradient>
                  </defs>

                  {[0, 1, 2, 3, 4].map((grid) => {
                    const y = (chart.height / 4) * grid;
                    return <line key={grid} stroke="#e5e7eb" strokeDasharray="4 5" strokeWidth="1" x1="0" x2={chart.width} y1={y} y2={y} />;
                  })}

                  <path d={chart.areaMeal} fill="url(#mealArea)" />
                  <path d={chart.areaWorkout} fill="url(#workoutArea)" />

                  <path d={chart.lineMeal} fill="none" stroke="#334155" strokeWidth="2.5" />
                  <path d={chart.lineWorkout} fill="none" stroke="#dc2626" strokeWidth="2.8" />

                  {stats.workoutTrend.map((point, index) => {
                    const x = index * chart.stepX;
                    const workoutY = chart.height - (point.workouts / chart.max) * chart.height;
                    const mealY = chart.height - (point.meals / chart.max) * chart.height;
                    const active = selectedIndex === index;
                    return (
                      <g key={point.date}>
                        {active && <line stroke="#94a3b8" strokeDasharray="3 4" strokeWidth="1" x1={x} x2={x} y1="0" y2={chart.height} />}
                        <circle cx={x} cy={mealY} fill="#1e293b" r={active ? 4.6 : 3.4} />
                        <circle cx={x} cy={workoutY} fill="#dc2626" r={active ? 5 : 3.8} />
                        <rect
                          fill="transparent"
                          height={chart.height}
                          onMouseEnter={() => setHoveredIndex(index)}
                          onMouseLeave={() => setHoveredIndex(null)}
                          width={Math.max(chart.stepX, 24)}
                          x={x - Math.max(chart.stepX, 24) / 2}
                          y={0}
                        />
                      </g>
                    );
                  })}
                </svg>

                {selectedPoint && (
                  <div className="mt-3 grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs sm:grid-cols-3">
                    <div className="font-semibold text-slate-700">{selectedPoint.date}</div>
                    <div className="font-semibold text-red-700">
                      {t.adminOverview.workoutSeries}: {selectedPoint.workouts}
                    </div>
                    <div className="font-semibold text-slate-700">
                      {t.adminOverview.mealSeries}: {selectedPoint.meals}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </article>

        <article className="gs-admin-tile rounded-2xl border border-slate-300 bg-white p-4 shadow-[0_16px_34px_-28px_rgba(15,23,42,0.4)]">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">{t.adminOverview.modulesTitle}</h2>
          <div className="space-y-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
              {t.adminOverview.publishedAnnouncements}:{" "}
              <span className="font-semibold text-slate-900">{loading ? "--" : formatNumber(stats.publishedAnnouncements)}</span>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
              {t.adminOverview.activeUsers}:{" "}
              <span className="font-semibold text-slate-900">{loading ? "--" : formatNumber(stats.activeUsers7d)}</span>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
              {t.adminOverview.totalUsers}:{" "}
              <span className="font-semibold text-slate-900">{loading ? "--" : formatNumber(stats.totalUsers)}</span>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {t.adminOverview.workoutsVsLastWeek}:{" "}
              <span className="font-bold text-red-800">
                {loading ? "--" : `${workoutDelta >= 0 ? "+" : ""}${workoutDelta.toFixed(1)}%`}
              </span>
            </div>
          </div>
        </article>
      </div>

      <div className="grid gap-3 xl:grid-cols-[1fr_1fr]">
        <article className="gs-admin-tile rounded-2xl border border-slate-300 bg-white p-4 shadow-[0_16px_34px_-28px_rgba(15,23,42,0.4)]">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">{t.adminOverview.distributionTitle}</h2>
          <div className="grid gap-4 md:grid-cols-[210px_1fr]">
            <div className="grid place-items-center">
              <div className="relative h-44 w-44 rounded-full" style={{ background: distribution.gradient }}>
                <div className="absolute inset-5 grid place-items-center rounded-full bg-white text-center">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total</p>
                  <p className="text-2xl font-extrabold text-slate-900">{formatNumber(distribution.total)}</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {distribution.rows.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">{t.adminOverview.noChart}</div>
              ) : (
                distribution.rows.map((row) => {
                  const label = t.adminOverview.modulesMap[row.key];
                  const pct = distribution.total > 0 ? ((row.count / distribution.total) * 100).toFixed(1) : "0.0";
                  return (
                    <div key={row.key} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: MODULE_COLORS[row.key] }} />
                        <span className="text-sm font-medium text-slate-700">{label}</span>
                      </div>
                      <div className="text-sm font-semibold text-slate-900">
                        {formatNumber(row.count)} ({pct}%)
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </article>

        <article className="gs-admin-tile rounded-2xl border border-slate-300 bg-white p-4 shadow-[0_16px_34px_-28px_rgba(15,23,42,0.4)]">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">{t.adminOverview.topUsersTitle}</h2>
          <div className="space-y-2">
            {stats.topActiveUsers.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">{t.adminOverview.noTopUsers}</div>
            ) : (
              stats.topActiveUsers.map((user, index) => (
                <div key={user.userId} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <div className="flex items-center gap-3">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-slate-900 text-xs font-bold text-white">{index + 1}</span>
                    <span className="text-sm font-semibold text-slate-800">{user.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-red-700">
                    {formatNumber(user.workoutCount)} {t.adminOverview.workoutCount}
                  </span>
                </div>
              ))
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
