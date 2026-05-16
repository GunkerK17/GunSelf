"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Database } from "@gunself/types";

import { supabase } from "@/lib/supabase/client";

type AuditLog = Database["public"]["Tables"]["admin_audit_logs"]["Row"];

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(dateStr));
}

export default function AdminActivityPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<"all" | "7d" | "30d" | "90d">("30d");
  const [page, setPage] = useState(1);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: loadError } = await supabase.from("admin_audit_logs").select("*").order("created_at", { ascending: false }).limit(200);
    if (loadError) {
      setError(loadError.message);
      setLogs([]);
      setLoading(false);
      return;
    }

    setLogs(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  const actionOptions = useMemo(() => {
    return ["all", ...Array.from(new Set(logs.map((log) => log.action))).sort()];
  }, [logs]);

  const entityOptions = useMemo(() => {
    return ["all", ...Array.from(new Set(logs.map((log) => log.entity))).sort()];
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const now = Date.now();
    const limitDays = dateFilter === "all" ? 0 : Number(dateFilter.replace("d", ""));

    return logs.filter((log) => {
      if (actionFilter !== "all" && log.action !== actionFilter) {
        return false;
      }
      if (entityFilter !== "all" && log.entity !== entityFilter) {
        return false;
      }
      if (limitDays > 0) {
        const createdAtMs = new Date(log.created_at).getTime();
        const diffDays = (now - createdAtMs) / (1000 * 60 * 60 * 24);
        if (diffDays > limitDays) {
          return false;
        }
      }
      if (!keyword) {
        return true;
      }

      const haystack = `${log.action} ${log.entity} ${log.message ?? ""} ${log.actor_user_id ?? ""} ${log.target_user_id ?? ""}`.toLowerCase();
      return haystack.includes(keyword);
    });
  }, [actionFilter, dateFilter, entityFilter, logs, search]);

  const PAGE_SIZE = 15;
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedLogs = filteredLogs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function handleExportCsv() {
    const header = ["created_at", "entity", "action", "message", "actor_user_id", "target_user_id"];
    const escapeCell = (value: string) => `"${value.replaceAll("\"", "\"\"")}"`;
    const rows = filteredLogs.map((log) =>
      [
        log.created_at,
        log.entity,
        log.action,
        log.message ?? "",
        log.actor_user_id ?? "",
        log.target_user_id ?? ""
      ]
        .map((cell) => escapeCell(cell))
        .join(",")
    );

    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `admin-audit-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <section className="space-y-4">
      <header className="gs-admin-tile rounded-3xl border border-slate-300 bg-white p-5">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Audit Log</h1>
        <p className="mt-1 text-sm text-slate-600">Track admin actions: create/delete users, ban/unban, publish announcements, and role changes.</p>
      </header>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <article className="gs-admin-tile rounded-2xl border border-slate-300 bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-900">Recent activity</h2>
          <div className="flex flex-wrap items-center gap-2">
            <input
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700"
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search logs..."
              value={search}
            />
            <select
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700"
              onChange={(event) => {
                setActionFilter(event.target.value);
                setPage(1);
              }}
              value={actionFilter}
            >
              {actionOptions.map((item) => (
                <option key={item} value={item}>
                  Action: {item}
                </option>
              ))}
            </select>
            <select
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700"
              onChange={(event) => {
                setEntityFilter(event.target.value);
                setPage(1);
              }}
              value={entityFilter}
            >
              {entityOptions.map((item) => (
                <option key={item} value={item}>
                  Entity: {item}
                </option>
              ))}
            </select>
            <select
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700"
              onChange={(event) => {
                setDateFilter(event.target.value as "all" | "7d" | "30d" | "90d");
                setPage(1);
              }}
              value={dateFilter}
            >
              <option value="all">All time</option>
              <option value="7d">Last 7d</option>
              <option value="30d">Last 30d</option>
              <option value="90d">Last 90d</option>
            </select>
            <button
              className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-1.5 text-sm text-slate-700"
              onClick={() => void loadLogs()}
              type="button"
            >
              Refresh
            </button>
            <button
              className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-1.5 text-sm text-slate-700"
              onClick={handleExportCsv}
              type="button"
            >
              Export CSV
            </button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">Loading...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">No audit data yet.</div>
        ) : (
          <div className="space-y-2">
            {pagedLogs.map((log) => (
              <div key={log.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold uppercase tracking-wide text-rose-700">
                    {log.entity} / {log.action}
                  </p>
                  <p className="text-xs text-slate-500">{formatDate(log.created_at)}</p>
                </div>
                <p className="mt-1 text-sm text-slate-800">{log.message || "-"}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Actor: {log.actor_user_id || "-"} | Target: {log.target_user_id || "-"}
                </p>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-60"
            disabled={currentPage <= 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            type="button"
          >
            Prev
          </button>
          <span className="text-xs text-slate-500">
            Page {currentPage}/{totalPages}
          </span>
          <button
            className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-60"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            type="button"
          >
            Next
          </button>
        </div>
      </article>
    </section>
  );
}
