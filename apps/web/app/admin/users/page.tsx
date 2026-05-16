"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Database } from "@gunself/types";

import { useLanguage } from "@/components/providers/language-provider";
import { supabase } from "@/lib/supabase/client";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

type UserActivitySummary = {
  workouts: number;
  meals: number;
  activities: number;
  sleepLogs: number;
  moodLogs: number;
  goals: number;
};
type UserFilter = "all" | "admin" | "user" | "banned" | "archived";
type UserTimelineItem = {
  id: string;
  label: string;
  detail: string;
  at: string;
};

const PAGE_SIZE = 12;

function formatDate(dateStr: string | null) {
  if (!dateStr) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(dateStr));
}

function emptySummary(): UserActivitySummary {
  return {
    workouts: 0,
    meals: 0,
    activities: 0,
    sleepLogs: 0,
    moodLogs: 0,
    goals: 0
  };
}

export default function AdminUsersPage() {
  const { t } = useLanguage();
  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [userFilter, setUserFilter] = useState<UserFilter>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [createLoading, setCreateLoading] = useState(false);
  const [createForm, setCreateForm] = useState({
    email: "",
    password: "",
    displayName: "",
    phone: ""
  });

  const [selectedUser, setSelectedUser] = useState<ProfileRow | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailSummary, setDetailSummary] = useState<UserActivitySummary>(emptySummary());
  const [banReasonDraft, setBanReasonDraft] = useState("");
  const [timeline, setTimeline] = useState<UserTimelineItem[]>([]);
  const [currentIsSuperAdmin, setCurrentIsSuperAdmin] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotice(null);

    const { data, error: loadError } = await supabase
      .from("profiles")
      .select(
        "id,display_name,email,phone,role,is_super_admin,is_banned,banned_at,ban_reason,is_archived,archived_at,archived_reason,admin_modules,created_at,timezone,avatar_url"
      )
      .order("created_at", { ascending: false });

    if (loadError) {
      setError(`${t.adminUsers.loadFailed}: ${loadError.message}`);
      setUsers([]);
      setLoading(false);
      return;
    }

    setUsers(data ?? []);
    setLoading(false);
  }, [t.adminUsers.loadFailed]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    let active = true;

    async function loadCurrentAdmin() {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!active || !session?.user.id) {
        return;
      }

      const { data: profile } = await supabase.from("profiles").select("is_super_admin").eq("id", session.user.id).maybeSingle();
      if (!active) {
        return;
      }
      setCurrentIsSuperAdmin(Boolean(profile?.is_super_admin));
    }

    void loadCurrentAdmin();
    return () => {
      active = false;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const filteredByRole = users.filter((user) => {
      if (userFilter === "all") {
        return true;
      }
      if (userFilter === "banned") {
        return user.is_banned;
      }
      if (userFilter === "archived") {
        return user.is_archived;
      }
      return user.role === userFilter;
    });

    const keyword = search.trim().toLowerCase();
    if (!keyword) {
      return filteredByRole;
    }

    return filteredByRole.filter((user) => {
      const name = (user.display_name ?? "").toLowerCase();
      const email = (user.email ?? "").toLowerCase();
      const phone = (user.phone ?? "").toLowerCase();
      const id = user.id.toLowerCase();
      return name.includes(keyword) || email.includes(keyword) || phone.includes(keyword) || id.includes(keyword);
    });
  }, [search, userFilter, users]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedUsers = filteredUsers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const totalUsers = users.length;
  const totalAdmins = users.filter((user) => user.role === "admin").length;
  const totalNormalUsers = totalUsers - totalAdmins;

  useEffect(() => {
    const currentIds = new Set(filteredUsers.map((user) => user.id));
    setSelectedIds((prev) => prev.filter((id) => currentIds.has(id)));
  }, [filteredUsers]);

  async function openDetail(user: ProfileRow) {
    setSelectedUser(user);
    setBanReasonDraft(user.ban_reason ?? "");
    setDetailLoading(true);
    setDetailError(null);

    const [workoutsRes, mealsRes, activitiesRes, sleepRes, moodRes, goalsRes] = await Promise.all([
      supabase.from("workouts").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("meals").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("activity_logs").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("sleep_logs").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("mood_logs").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("goals").select("id", { count: "exact", head: true }).eq("user_id", user.id)
    ]);

    const firstError = workoutsRes.error || mealsRes.error || activitiesRes.error || sleepRes.error || moodRes.error || goalsRes.error;
    if (firstError) {
      setDetailError(`${t.adminUsers.detailLoadFailed} ${firstError.message}`);
      setDetailSummary(emptySummary());
      setDetailLoading(false);
      return;
    }

    setDetailSummary({
      workouts: workoutsRes.count ?? 0,
      meals: mealsRes.count ?? 0,
      activities: activitiesRes.count ?? 0,
      sleepLogs: sleepRes.count ?? 0,
      moodLogs: moodRes.count ?? 0,
      goals: goalsRes.count ?? 0
    });

    const [latestWorkoutRes, latestMealRes, latestMoodRes, latestSleepRes, latestGoalRes] = await Promise.all([
      supabase.from("workouts").select("id,name,logged_at").eq("user_id", user.id).order("logged_at", { ascending: false }).limit(4),
      supabase.from("meals").select("id,title,logged_at").eq("user_id", user.id).order("logged_at", { ascending: false }).limit(4),
      supabase.from("mood_logs").select("id,journal_note,logged_at").eq("user_id", user.id).order("logged_at", { ascending: false }).limit(4),
      supabase.from("sleep_logs").select("id,duration_minutes,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(4),
      supabase.from("goals").select("id,title,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(4)
    ]);

    const timelineItems: UserTimelineItem[] = [
      ...(latestWorkoutRes.data ?? []).map((row) => ({
        id: `w-${row.id}`,
        label: "Workout",
        detail: row.name,
        at: row.logged_at
      })),
      ...(latestMealRes.data ?? []).map((row) => ({
        id: `m-${row.id}`,
        label: "Meal",
        detail: row.title,
        at: row.logged_at
      })),
      ...(latestMoodRes.data ?? []).map((row) => ({
        id: `mo-${row.id}`,
        label: "Mood",
        detail: row.journal_note || "Mood check-in",
        at: row.logged_at
      })),
      ...(latestSleepRes.data ?? []).map((row) => ({
        id: `s-${row.id}`,
        label: "Sleep",
        detail: `${row.duration_minutes ?? 0} mins`,
        at: row.created_at
      })),
      ...(latestGoalRes.data ?? []).map((row) => ({
        id: `g-${row.id}`,
        label: "Goal",
        detail: row.title,
        at: row.created_at
      }))
    ]
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 12);

    setTimeline(timelineItems);
    setDetailLoading(false);
  }

  function closeDetail() {
    setSelectedUser(null);
    setDetailError(null);
    setDetailSummary(emptySummary());
    setBanReasonDraft("");
    setTimeline([]);
  }

  async function getActorUserId() {
    const {
      data: { session }
    } = await supabase.auth.getSession();
    return session?.user.id ?? null;
  }

  async function logAdminAction(params: { action: string; entity: string; targetUserId?: string; message: string }) {
    const actorUserId = await getActorUserId();
    await supabase.from("admin_audit_logs").insert({
      actor_user_id: actorUserId,
      target_user_id: params.targetUserId ?? null,
      action: params.action,
      entity: params.entity,
      message: params.message,
      metadata: {}
    });
  }

  async function handleToggleBan(user: ProfileRow) {
    setSavingId(user.id);
    setError(null);
    setNotice(null);

    const nextBanned = !user.is_banned;
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        is_banned: nextBanned,
        banned_at: nextBanned ? new Date().toISOString() : null,
        ban_reason: nextBanned ? banReasonDraft.trim() || "Violation policy" : null
      })
      .eq("id", user.id);

    if (updateError) {
      setError(`${t.adminUsers.banFailed}: ${updateError.message}`);
      setSavingId(null);
      return;
    }

    setUsers((prev) =>
      prev.map((item) =>
        item.id === user.id
          ? {
              ...item,
              is_banned: nextBanned,
              banned_at: nextBanned ? new Date().toISOString() : null,
              ban_reason: nextBanned ? banReasonDraft.trim() || "Violation policy" : null
            }
          : item
      )
    );

    if (selectedUser?.id === user.id) {
      setSelectedUser((prev) =>
        prev
          ? {
              ...prev,
              is_banned: nextBanned,
              banned_at: nextBanned ? new Date().toISOString() : null,
              ban_reason: nextBanned ? banReasonDraft.trim() || "Violation policy" : null
            }
          : prev
      );
    }

    setNotice(nextBanned ? t.adminUsers.banSuccess : t.adminUsers.unbanSuccess);
    await logAdminAction({
      action: nextBanned ? "ban" : "unban",
      entity: "user",
      targetUserId: user.id,
      message: `${nextBanned ? "Banned" : "Unbanned"} ${user.email ?? user.id}`
    });
    setSavingId(null);
  }

  async function handleSaveBanReason() {
    if (!selectedUser) {
      return;
    }

    setSavingId(selectedUser.id);
    setError(null);
    setNotice(null);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        ban_reason: banReasonDraft.trim() || null
      })
      .eq("id", selectedUser.id);

    if (updateError) {
      setError(`${t.adminUsers.updateFailed}: ${updateError.message}`);
      setSavingId(null);
      return;
    }

    setUsers((prev) =>
      prev.map((item) =>
        item.id === selectedUser.id
          ? {
              ...item,
              ban_reason: banReasonDraft.trim() || null
            }
          : item
      )
    );
    setSelectedUser((prev) =>
      prev
        ? {
            ...prev,
            ban_reason: banReasonDraft.trim() || null
          }
        : prev
    );

    setNotice("Ban reason updated.");
    await logAdminAction({
      action: "update",
      entity: "user",
      targetUserId: selectedUser.id,
      message: `Updated ban reason for ${selectedUser.email ?? selectedUser.id}`
    });
    setSavingId(null);
  }

  async function handleArchiveToggleUser(user: ProfileRow) {
    const actorUserId = await getActorUserId();
    if (actorUserId && actorUserId === user.id && !user.is_archived) {
      setError("You cannot archive your own admin account.");
      return;
    }

    const nextArchived = !user.is_archived;
    const confirmed = window.confirm(
      `${nextArchived ? "Archive" : "Restore"} user ${user.email ?? user.id}?\n${nextArchived ? "User will be hidden from active lists." : "User will become active again."}`
    );
    if (!confirmed) {
      return;
    }

    setSavingId(user.id);
    setError(null);
    setNotice(null);

    const res = await fetch("/api/admin/dev-tools", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: nextArchived ? "archive_user" : "restore_user",
        userId: user.id,
        actorUserId,
        reason: nextArchived ? "Archived from user management" : null
      })
    });

    const payload = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok || !payload.ok) {
      setError(payload.error ?? `${nextArchived ? "Archive" : "Restore"} user failed.`);
      setSavingId(null);
      return;
    }

    setUsers((prev) =>
      prev.map((item) =>
        item.id === user.id
          ? {
              ...item,
              is_archived: nextArchived,
              archived_at: nextArchived ? new Date().toISOString() : null,
              archived_reason: nextArchived ? "Archived from user management" : null
            }
          : item
      )
    );
    if (selectedUser?.id === user.id) {
      setSelectedUser((prev) =>
        prev
          ? {
              ...prev,
              is_archived: nextArchived,
              archived_at: nextArchived ? new Date().toISOString() : null,
              archived_reason: nextArchived ? "Archived from user management" : null
            }
          : prev
      );
    }
    setNotice(`${nextArchived ? "Archived" : "Restored"} user ${user.email ?? user.id}`);
    setSavingId(null);
  }

  async function handleHardDeleteUser(user: ProfileRow) {
    if (!currentIsSuperAdmin) {
      setError("Only super admin can hard delete users.");
      return;
    }

    const actorUserId = await getActorUserId();
    if (actorUserId && actorUserId === user.id) {
      setError("You cannot delete your own admin account.");
      return;
    }

    const confirmed = window.confirm(`Permanently delete user ${user.email ?? user.id}?\nThis action cannot be undone.`);
    if (!confirmed) {
      return;
    }

    setSavingId(user.id);
    setError(null);
    setNotice(null);

    const res = await fetch("/api/admin/dev-tools", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "delete_user",
        userId: user.id,
        actorUserId
      })
    });

    const payload = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok || !payload.ok) {
      setError(payload.error ?? "Delete user failed.");
      setSavingId(null);
      return;
    }

    setUsers((prev) => prev.filter((item) => item.id !== user.id));
    if (selectedUser?.id === user.id) {
      closeDetail();
    }
    setNotice(`Deleted user ${user.email ?? user.id}`);
    setSelectedIds((prev) => prev.filter((id) => id !== user.id));
    setSavingId(null);
  }

  function toggleSelectOne(userId: string) {
    setSelectedIds((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]));
  }

  function toggleSelectPage() {
    const pageIds = pagedUsers.map((user) => user.id);
    const allSelected = pageIds.every((id) => selectedSet.has(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
      return;
    }

    setSelectedIds((prev) => [...new Set([...prev, ...pageIds])]);
  }

  async function handleBulkBan(nextBanned: boolean) {
    if (selectedIds.length === 0) {
      setError("Select users first.");
      return;
    }

    setError(null);
    setNotice(null);
    const nowIso = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        is_banned: nextBanned,
        banned_at: nextBanned ? nowIso : null,
        ban_reason: nextBanned ? "Bulk moderation action" : null
      })
      .in("id", selectedIds);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setUsers((prev) =>
      prev.map((item) =>
        selectedSet.has(item.id)
          ? {
              ...item,
              is_banned: nextBanned,
              banned_at: nextBanned ? nowIso : null,
              ban_reason: nextBanned ? "Bulk moderation action" : null
            }
          : item
      )
    );

    await logAdminAction({
      action: nextBanned ? "bulk_ban" : "bulk_unban",
      entity: "user",
      message: `${nextBanned ? "Banned" : "Unbanned"} ${selectedIds.length} users`
    });
    setNotice(`${nextBanned ? "Banned" : "Unbanned"} ${selectedIds.length} users.`);
  }

  async function handleBulkArchive(nextArchived: boolean) {
    if (selectedIds.length === 0) {
      setError("Select users first.");
      return;
    }

    const actorUserId = await getActorUserId();
    const targets = nextArchived ? selectedIds.filter((id) => id !== actorUserId) : [...selectedIds];
    if (targets.length === 0) {
      setError("No valid users for this action.");
      return;
    }

    const confirmed = window.confirm(`${nextArchived ? "Archive" : "Restore"} ${targets.length} users?`);
    if (!confirmed) {
      return;
    }

    setError(null);
    setNotice(null);
    let processedCount = 0;
    const failed: string[] = [];

    for (const userId of targets) {
      const res = await fetch("/api/admin/dev-tools", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: nextArchived ? "archive_user" : "restore_user",
          userId,
          actorUserId,
          reason: nextArchived ? "Archived by bulk action" : null
        })
      });

      const payload = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !payload.ok) {
        failed.push(`${userId}: ${payload.error ?? "Unknown error"}`);
        continue;
      }
      processedCount += 1;
    }

    if (processedCount > 0) {
      const nowIso = new Date().toISOString();
      setUsers((prev) =>
        prev.map((item) =>
          targets.includes(item.id)
            ? {
                ...item,
                is_archived: nextArchived,
                archived_at: nextArchived ? nowIso : null,
                archived_reason: nextArchived ? "Archived by bulk action" : null
              }
            : item
        )
      );
      setSelectedIds((prev) => prev.filter((id) => !targets.includes(id)));
    }

    if (failed.length > 0) {
      setError(`${nextArchived ? "Archived" : "Restored"} ${processedCount}. Failed ${failed.length}: ${failed.join(" | ")}`);
    } else {
      setNotice(`${nextArchived ? "Archived" : "Restored"} ${processedCount} users.`);
    }
  }

  async function handleBulkHardDelete() {
    if (!currentIsSuperAdmin) {
      setError("Only super admin can hard delete users.");
      return;
    }

    if (selectedIds.length === 0) {
      setError("Select users first.");
      return;
    }

    const actorUserId = await getActorUserId();
    const deleteTargets = selectedIds.filter((id) => id !== actorUserId);
    if (deleteTargets.length === 0) {
      setError("You cannot delete your own admin account.");
      return;
    }

    const confirmed = window.confirm(`Permanently delete ${deleteTargets.length} users?\nThis action cannot be undone.`);
    if (!confirmed) {
      return;
    }

    setError(null);
    setNotice(null);
    let deletedCount = 0;
    const failed: string[] = [];

    for (const userId of deleteTargets) {
      const res = await fetch("/api/admin/dev-tools", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "delete_user",
          userId,
          actorUserId
        })
      });

      const payload = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !payload.ok) {
        failed.push(`${userId}: ${payload.error ?? "Unknown error"}`);
        continue;
      }
      deletedCount += 1;
    }

    if (deletedCount > 0) {
      setUsers((prev) => prev.filter((item) => !deleteTargets.includes(item.id)));
      setSelectedIds((prev) => prev.filter((id) => !deleteTargets.includes(id)));
      if (selectedUser && deleteTargets.includes(selectedUser.id)) {
        closeDetail();
      }
    }

    if (failed.length > 0) {
      setError(`Deleted ${deletedCount}. Failed ${failed.length}: ${failed.join(" | ")}`);
    } else {
      setNotice(`Deleted ${deletedCount} users.`);
    }
  }

  function exportUsersCsv() {
    const rows = filteredUsers.map((user) => [
      user.id,
      user.display_name ?? "",
      user.email ?? "",
      user.phone ?? "",
      user.role,
      user.is_super_admin ? "true" : "false",
      user.is_banned ? "true" : "false",
      user.is_archived ? "true" : "false",
      formatDate(user.created_at)
    ]);
    const header = ["id", "display_name", "email", "phone", "role", "is_super_admin", "is_banned", "is_archived", "created_at"];
    const toCell = (value: string) => `"${value.replaceAll("\"", "\"\"")}"`;
    const csv = [header.join(","), ...rows.map((row) => row.map((cell) => toCell(cell)).join(","))].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `users-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async function handleCreateUser() {
    if (!createForm.email.trim() || !createForm.password.trim()) {
      setError("Email and password are required.");
      return;
    }

    if (createForm.password.trim().length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    const actorUserId = await getActorUserId();
    if (!actorUserId) {
      setError("Session expired. Please login again.");
      return;
    }

    setCreateLoading(true);
    setError(null);
    setNotice(null);

    const res = await fetch("/api/admin/dev-tools", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "create_user",
        email: createForm.email.trim().toLowerCase(),
        password: createForm.password,
        displayName: createForm.displayName.trim() || null,
        phone: createForm.phone.trim() || null,
        role: "user",
        actorUserId
      })
    });

    const payload = (await res.json()) as { ok?: boolean; error?: string; result?: { email?: string } };
    if (!res.ok || !payload.ok) {
      setError(payload.error ?? "Create user failed.");
      setCreateLoading(false);
      return;
    }

    setNotice(`Created user ${payload.result?.email ?? createForm.email.trim().toLowerCase()}.`);
    setCreateForm({
      email: "",
      password: "",
      displayName: "",
      phone: ""
    });
    setCreateLoading(false);
    await loadUsers();
  }

  return (
    <section className="space-y-5">
      <header className="gs-admin-tile rounded-3xl border border-slate-300 bg-white p-5 shadow-[0_20px_38px_-28px_rgba(15,23,42,0.42)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t.adminUsers.title}</h1>
            <p className="mt-1 text-sm text-slate-600">{t.adminUsers.subtitle}</p>
          </div>
          <button
            className="rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
            onClick={() => void loadUsers()}
            type="button"
          >
            {t.adminUsers.refresh}
          </button>
        </div>
      </header>

      <div className="grid gap-3 md:grid-cols-3">
        <article className="gs-admin-tile rounded-2xl border border-slate-300 bg-white p-4">
          <p className="text-sm font-semibold text-slate-500">{t.adminUsers.totalUsers}</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">{totalUsers}</p>
        </article>
        <article className="gs-admin-tile rounded-2xl border border-slate-300 bg-white p-4">
          <p className="text-sm font-semibold text-slate-500">{t.adminUsers.admins}</p>
          <p className="mt-2 text-3xl font-extrabold text-red-700">{totalAdmins}</p>
        </article>
        <article className="gs-admin-tile rounded-2xl border border-slate-300 bg-white p-4">
          <p className="text-sm font-semibold text-slate-500">{t.adminUsers.normalUsers}</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">{totalNormalUsers}</p>
        </article>
      </div>

      <article className="gs-admin-tile rounded-2xl border border-slate-300 bg-white p-4 shadow-[0_16px_34px_-28px_rgba(15,23,42,0.4)]">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-900">Create User</h2>
          <button
            className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700"
            onClick={exportUsersCsv}
            type="button"
          >
            Export CSV
          </button>
        </div>
        <div className="grid gap-2 md:grid-cols-5">
          <input
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            onChange={(event) => setCreateForm((prev) => ({ ...prev, email: event.target.value }))}
            placeholder="email@example.com"
            type="email"
            value={createForm.email}
          />
          <input
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            minLength={8}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, password: event.target.value }))}
            placeholder="Password (min 8 chars)"
            type="password"
            value={createForm.password}
          />
          <input
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            onChange={(event) => setCreateForm((prev) => ({ ...prev, displayName: event.target.value }))}
            placeholder="Display name"
            type="text"
            value={createForm.displayName}
          />
          <input
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            onChange={(event) => setCreateForm((prev) => ({ ...prev, phone: event.target.value }))}
            placeholder="Phone (optional)"
            type="text"
            value={createForm.phone}
          />
          <button
            className="rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
            disabled={createLoading}
            onClick={() => void handleCreateUser()}
            type="button"
          >
            {createLoading ? t.common.loading : "Create user"}
          </button>
        </div>
      </article>

      <article className="gs-admin-tile rounded-2xl border border-slate-300 bg-white p-4 shadow-[0_16px_34px_-28px_rgba(15,23,42,0.4)]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <input
            className="w-full max-w-md rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-red-300 focus:bg-white focus:outline-none"
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder={t.adminUsers.searchPlaceholder}
            value={search}
          />
          <div className="text-xs text-slate-500">
            {t.adminUsers.page} {currentPage}/{totalPages}
          </div>
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          {(
            [
              { key: "all", label: "All" },
              { key: "admin", label: "Admin" },
              { key: "user", label: "User" },
              { key: "banned", label: "Banned" },
              { key: "archived", label: "Archived" }
            ] as Array<{ key: UserFilter; label: string }>
          ).map((item) => {
            const active = userFilter === item.key;
            return (
              <button
                key={item.key}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100"
                }`}
                onClick={() => {
                  setUserFilter(item.key);
                  setPage(1);
                }}
                type="button"
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="flex items-center gap-2">
            <button
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700"
              onClick={toggleSelectPage}
              type="button"
            >
              {pagedUsers.length > 0 && pagedUsers.every((user) => selectedSet.has(user.id)) ? "Unselect page" : "Select page"}
            </button>
            <span className="text-xs text-slate-600">Selected: {selectedIds.length}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-lg border border-rose-300 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700"
              onClick={() => void handleBulkBan(true)}
              type="button"
            >
              Ban selected
            </button>
            <button
              className="rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700"
              onClick={() => void handleBulkBan(false)}
              type="button"
            >
              Unban selected
            </button>
            <button
              className="rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-700"
              onClick={() => void handleBulkArchive(true)}
              type="button"
            >
              Archive selected
            </button>
            <button
              className="rounded-lg border border-sky-300 bg-sky-50 px-2.5 py-1.5 text-xs font-semibold text-sky-700"
              onClick={() => void handleBulkArchive(false)}
              type="button"
            >
              Restore selected
            </button>
            <button
              className="rounded-lg border border-red-300 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 disabled:opacity-60"
              disabled={!currentIsSuperAdmin}
              onClick={() => void handleBulkHardDelete()}
              type="button"
            >
              Hard delete selected
            </button>
          </div>
        </div>

        {error && <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        {notice && <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</div>}

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">{t.common.loading}</div>
        ) : pagedUsers.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">{t.adminUsers.noData}</div>
        ) : (
          <>
            <div className="hidden overflow-x-auto rounded-xl border border-slate-200 md:block">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="px-3 py-2">
                      <input
                        checked={pagedUsers.length > 0 && pagedUsers.every((user) => selectedSet.has(user.id))}
                        onChange={toggleSelectPage}
                        type="checkbox"
                      />
                    </th>
                    <th className="px-3 py-2">{t.adminUsers.tableUser}</th>
                    <th className="px-3 py-2">{t.adminUsers.tableRole}</th>
                    <th className="px-3 py-2">{t.adminUsers.tableStatus}</th>
                    <th className="px-3 py-2">{t.adminUsers.tableCreatedAt}</th>
                    <th className="px-3 py-2">{t.adminUsers.tableAction}</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedUsers.map((user) => (
                    <tr key={user.id} className="border-t border-slate-200 bg-white">
                      <td className="px-3 py-2">
                        <input checked={selectedSet.has(user.id)} onChange={() => toggleSelectOne(user.id)} type="checkbox" />
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-semibold text-slate-900">{user.display_name || user.id.slice(0, 8)}</div>
                        {user.is_super_admin && (
                          <span className="mt-1 inline-flex rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                            Super Admin
                          </span>
                        )}
                        <div className="text-xs text-slate-600">{user.email || user.phone || t.adminUsers.noContact}</div>
                        <div className="text-xs text-slate-500">{user.id}</div>
                      </td>
                      <td className="px-3 py-2 text-slate-700">{user.role}</td>
                      <td className="px-3 py-2">
                        {user.is_archived ? (
                          <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">Archived</span>
                        ) : (
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              user.is_banned ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {user.is_banned ? t.adminUsers.statusBanned : t.adminUsers.statusActive}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-slate-700">{formatDate(user.created_at)}</td>
                      <td className="px-3 py-2">
                        <div className="flex gap-2">
                          <button
                            className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                            onClick={() => void openDetail(user)}
                            type="button"
                          >
                            {t.adminUsers.detail}
                          </button>
                          <button
                            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-60 ${
                              user.is_banned
                                ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                : "border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100"
                            }`}
                            disabled={savingId === user.id}
                            onClick={() => void handleToggleBan(user)}
                            type="button"
                          >
                            {savingId === user.id ? t.common.loading : user.is_banned ? t.adminUsers.unban : t.adminUsers.ban}
                          </button>
                          <button
                            className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
                            disabled={savingId === user.id}
                            onClick={() => void handleArchiveToggleUser(user)}
                            type="button"
                          >
                            {user.is_archived ? "Restore" : "Archive"}
                          </button>
                          <button
                            className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                            disabled={savingId === user.id || !currentIsSuperAdmin}
                            onClick={() => void handleHardDeleteUser(user)}
                            type="button"
                          >
                            Hard delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 md:hidden">
              {pagedUsers.map((user) => (
                <div key={user.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="mb-2">
                    <input checked={selectedSet.has(user.id)} onChange={() => toggleSelectOne(user.id)} type="checkbox" />
                  </div>
                  <div className="font-semibold text-slate-900">{user.display_name || user.id.slice(0, 8)}</div>
                  {user.is_super_admin && (
                    <span className="mt-1 inline-flex rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                      Super Admin
                    </span>
                  )}
                  <div className="mt-0.5 text-xs text-slate-600">{user.email || user.phone || t.adminUsers.noContact}</div>
                  <div className="mt-0.5 text-xs text-slate-500">{user.id}</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-md border border-slate-300 bg-white px-2 py-1 text-slate-700">{user.role}</span>
                    {user.is_archived ? (
                      <span className="rounded-md bg-amber-100 px-2 py-1 font-semibold text-amber-700">Archived</span>
                    ) : (
                      <span
                        className={`rounded-md px-2 py-1 font-semibold ${
                          user.is_banned ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {user.is_banned ? t.adminUsers.statusBanned : t.adminUsers.statusActive}
                      </span>
                    )}
                    <span className="text-slate-500">{formatDate(user.created_at)}</span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                      onClick={() => void openDetail(user)}
                      type="button"
                    >
                      {t.adminUsers.detail}
                    </button>
                    <button
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                        user.is_banned ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-rose-300 bg-rose-50 text-rose-700"
                      }`}
                      disabled={savingId === user.id}
                      onClick={() => void handleToggleBan(user)}
                      type="button"
                    >
                      {savingId === user.id ? t.common.loading : user.is_banned ? t.adminUsers.unban : t.adminUsers.ban}
                    </button>
                    <button
                      className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700"
                      disabled={savingId === user.id}
                      onClick={() => void handleArchiveToggleUser(user)}
                      type="button"
                    >
                      {user.is_archived ? "Restore" : "Archive"}
                    </button>
                    <button
                      className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 disabled:opacity-60"
                      disabled={savingId === user.id || !currentIsSuperAdmin}
                      onClick={() => void handleHardDeleteUser(user)}
                      type="button"
                    >
                      Hard delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-60"
            disabled={currentPage <= 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            type="button"
          >
            {t.adminUsers.prev}
          </button>
          <button
            className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-60"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            type="button"
          >
            {t.adminUsers.next}
          </button>
        </div>
      </article>

      <div
        className={`fixed inset-0 z-40 transition ${
          selectedUser ? "pointer-events-auto bg-black/35 opacity-100" : "pointer-events-none bg-black/0 opacity-0"
        }`}
        onClick={closeDetail}
      />
      <aside
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-md border-l border-slate-700 bg-[#121212] p-5 text-slate-100 shadow-2xl transition-transform duration-300 ${
          selectedUser ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{t.adminUsers.detailTitle}</h2>
          <button className="rounded-lg border border-slate-600 bg-slate-800 px-2.5 py-1 text-sm" onClick={closeDetail} type="button">
            {t.adminUsers.close}
          </button>
        </div>

        {!selectedUser ? null : (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-4">
              <p className="text-lg font-semibold text-white">{selectedUser.display_name || selectedUser.id.slice(0, 8)}</p>
              <p className="mt-1 text-xs text-slate-300">{selectedUser.email || selectedUser.phone || t.adminUsers.noContact}</p>
              <div className="mt-3 grid gap-2 text-sm">
                <div>
                  <span className="text-slate-400">{t.adminUsers.userId}: </span>
                  <span className="break-all text-slate-200">{selectedUser.id}</span>
                </div>
                <div>
                  <span className="text-slate-400">{t.adminUsers.contact}: </span>
                  <span className="text-slate-200">{selectedUser.email || selectedUser.phone || t.adminUsers.noContact}</span>
                </div>
                <div>
                  <span className="text-slate-400">{t.adminUsers.timezone}: </span>
                  <span className="text-slate-200">{selectedUser.timezone || "-"}</span>
                </div>
                <div>
                  <span className="text-slate-400">{t.adminUsers.createdAt}: </span>
                  <span className="text-slate-200">{formatDate(selectedUser.created_at)}</span>
                </div>
                <div>
                  <span className="text-slate-400">{t.adminUsers.bannedAt}: </span>
                  <span className="text-slate-200">
                    {selectedUser.banned_at ? formatDate(selectedUser.banned_at) : t.adminUsers.noBanDate}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Ban reason: </span>
                  <span className="text-slate-200">{selectedUser.ban_reason || "-"}</span>
                </div>
                <div>
                  <span className="text-slate-400">Archived at: </span>
                  <span className="text-slate-200">{selectedUser.archived_at ? formatDate(selectedUser.archived_at) : "-"}</span>
                </div>
                <div>
                  <span className="text-slate-400">Archive reason: </span>
                  <span className="text-slate-200">{selectedUser.archived_reason || "-"}</span>
                </div>
              </div>
              <div className="mt-4">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400" htmlFor="ban-reason">
                  Ban reason editor
                </label>
                <textarea
                  className="min-h-20 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-red-300 focus:outline-none"
                  id="ban-reason"
                  onChange={(event) => setBanReasonDraft(event.target.value)}
                  placeholder="Optional reason shown in moderation logs"
                  value={banReasonDraft}
                />
                <button
                  className="mt-2 rounded-lg border border-slate-500 bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-100 hover:bg-slate-600"
                  disabled={savingId === selectedUser.id}
                  onClick={() => void handleSaveBanReason()}
                  type="button"
                >
                  {savingId === selectedUser.id ? t.common.loading : "Save reason"}
                </button>
              </div>
              <div className="mt-4">
                <button
                  className={`w-full rounded-lg border px-3 py-2 text-sm font-semibold ${
                    selectedUser.is_banned ? "border-emerald-300 bg-emerald-500/10 text-emerald-300" : "border-rose-300 bg-rose-500/10 text-rose-300"
                  }`}
                  disabled={savingId === selectedUser.id}
                  onClick={() => void handleToggleBan(selectedUser)}
                  type="button"
                >
                  {savingId === selectedUser.id ? t.common.loading : selectedUser.is_banned ? t.adminUsers.unban : t.adminUsers.ban}
                </button>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    className="w-full rounded-lg border border-amber-300 bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-300"
                    disabled={savingId === selectedUser.id}
                    onClick={() => void handleArchiveToggleUser(selectedUser)}
                    type="button"
                  >
                    {selectedUser.is_archived ? "Restore user" : "Archive user"}
                  </button>
                  <button
                    className="w-full rounded-lg border border-red-300 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-300 disabled:opacity-60"
                    disabled={savingId === selectedUser.id || !currentIsSuperAdmin}
                    onClick={() => void handleHardDeleteUser(selectedUser)}
                    type="button"
                  >
                    Hard delete
                  </button>
                </div>
              </div>

            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-4">
              <p className="mb-3 font-semibold text-white">{t.adminUsers.activitySummary}</p>
              {detailLoading ? (
                <p className="text-sm text-slate-400">{t.common.loading}</p>
              ) : detailError ? (
                <p className="text-sm text-rose-300">{detailError}</p>
              ) : (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2">{t.adminUsers.workouts}: {detailSummary.workouts}</div>
                  <div className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2">{t.adminUsers.meals}: {detailSummary.meals}</div>
                  <div className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2">{t.adminUsers.activities}: {detailSummary.activities}</div>
                  <div className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2">{t.adminUsers.sleepLogs}: {detailSummary.sleepLogs}</div>
                  <div className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2">{t.adminUsers.moodLogs}: {detailSummary.moodLogs}</div>
                  <div className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2">{t.adminUsers.goals}: {detailSummary.goals}</div>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-4">
              <p className="mb-3 font-semibold text-white">User Timeline</p>
              {timeline.length === 0 ? (
                <p className="text-sm text-slate-400">No recent activity.</p>
              ) : (
                <div className="space-y-2">
                  {timeline.map((item) => (
                    <div key={item.id} className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-rose-300">{item.label}</span>
                        <span className="text-xs text-slate-400">{formatDate(item.at)}</span>
                      </div>
                      <p className="mt-1 text-sm text-slate-200">{item.detail}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </aside>
    </section>
  );
}
