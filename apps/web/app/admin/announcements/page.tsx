"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { Database, Json } from "@gunself/types";

import { supabase } from "@/lib/supabase/client";

type Announcement = Database["public"]["Tables"]["announcements"]["Row"];

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

export default function AdminAnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [page, setPage] = useState(1);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: loadError } = await supabase.from("announcements").select("*").order("created_at", { ascending: false }).limit(300);

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

  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return items.filter((item) => {
      if (statusFilter === "published" && !item.is_published) {
        return false;
      }
      if (statusFilter === "draft" && item.is_published) {
        return false;
      }
      if (!keyword) {
        return true;
      }
      const haystack = `${item.title} ${item.content}`.toLowerCase();
      return haystack.includes(keyword);
    });
  }, [items, search, statusFilter]);

  const PAGE_SIZE = 8;
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedItems = filteredItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  async function logAction(action: string, entity: string, message: string, metadata: Json) {
    const {
      data: { session }
    } = await supabase.auth.getSession();

    await supabase.from("admin_audit_logs").insert({
      actor_user_id: session?.user.id ?? null,
      action,
      entity,
      message,
      metadata
    });
  }

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setContent("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("Title and content are required.");
      return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);

    if (editingId) {
      const { data, error: updateError } = await supabase
        .from("announcements")
        .update({
          title: title.trim(),
          content: content.trim(),
          updated_at: new Date().toISOString()
        })
        .eq("id", editingId)
        .select("*")
        .single();

      if (updateError || !data) {
        setError(updateError?.message ?? "Update announcement failed.");
        setSaving(false);
        return;
      }

      await logAction("update", "announcement", `Updated announcement ${data.title}`, { id: data.id });
      setItems((prev) => prev.map((x) => (x.id === editingId ? data : x)));
      setSaving(false);
      setNotice("Announcement updated.");
      resetForm();
      return;
    }

    const {
      data: { session }
    } = await supabase.auth.getSession();

    const { data, error: createError } = await supabase
      .from("announcements")
      .insert({
        title: title.trim(),
        content: content.trim(),
        created_by: session?.user.id ?? null,
        is_published: false
      })
      .select("*")
      .single();

    if (createError || !data) {
      setError(createError?.message ?? "Create announcement failed.");
      setSaving(false);
      return;
    }

    await logAction("create", "announcement", `Created announcement ${data.title}`, { id: data.id });
    setItems((prev) => [data, ...prev]);
    setSaving(false);
    setNotice("Announcement created.");
    setPage(1);
    resetForm();
  }

  function startEdit(item: Announcement) {
    setEditingId(item.id);
    setTitle(item.title);
    setContent(item.content);
    setError(null);
    setNotice(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function togglePublish(item: Announcement) {
    setError(null);
    setNotice(null);
    const nextPublished = !item.is_published;

    const { data, error: updateError } = await supabase
      .from("announcements")
      .update({
        is_published: nextPublished,
        published_at: nextPublished ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq("id", item.id)
      .select("*")
      .single();

    if (updateError || !data) {
      setError(updateError?.message ?? "Update failed.");
      return;
    }

    await logAction(nextPublished ? "publish" : "unpublish", "announcement", `${nextPublished ? "Published" : "Unpublished"} ${item.title}`, {
      id: item.id
    });
    setItems((prev) => prev.map((x) => (x.id === item.id ? data : x)));
    setNotice(nextPublished ? "Published." : "Unpublished.");
  }

  async function removeItem(item: Announcement) {
    const confirmed = window.confirm(`Delete announcement "${item.title}"?`);
    if (!confirmed) {
      return;
    }

    setError(null);
    setNotice(null);
    const { error: deleteError } = await supabase.from("announcements").delete().eq("id", item.id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    await logAction("delete", "announcement", `Deleted announcement ${item.title}`, { id: item.id });
    setItems((prev) => prev.filter((x) => x.id !== item.id));
    setNotice("Announcement deleted.");
  }

  return (
    <section className="space-y-4">
      <header className="gs-admin-tile rounded-3xl border border-slate-300 bg-white p-5">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Notification Center</h1>
        <p className="mt-1 text-sm text-slate-600">Create, publish, and manage admin announcements for users.</p>
      </header>

      <article className="gs-admin-tile rounded-2xl border border-slate-300 bg-white p-4">
        <h2 className="mb-2 text-lg font-semibold text-slate-900">{editingId ? "Edit announcement" : "Create announcement"}</h2>
        <form className="grid gap-2" onSubmit={(event) => void handleSubmit(event)}>
          <input
            className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900"
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Title"
            value={title}
          />
          <textarea
            className="min-h-28 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900"
            onChange={(event) => setContent(event.target.value)}
            placeholder="Announcement content"
            value={content}
          />
          <div className="flex gap-2">
            <button
              className="w-fit rounded-lg border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              disabled={saving}
              type="submit"
            >
              {saving ? "Saving..." : editingId ? "Update announcement" : "Create draft"}
            </button>
            {editingId && (
              <button
                className="w-fit rounded-lg border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700"
                onClick={resetForm}
                type="button"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </article>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</div>}

      <article className="gs-admin-tile rounded-2xl border border-slate-300 bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-900">Announcement list</h2>
          <div className="flex flex-wrap items-center gap-2">
            <input
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700"
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search title/content..."
              value={search}
            />
            <select
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700"
              onChange={(event) => {
                setStatusFilter(event.target.value as "all" | "published" | "draft");
                setPage(1);
              }}
              value={statusFilter}
            >
              <option value="all">All</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
            <button
              className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-1.5 text-sm text-slate-700"
              onClick={() => void loadItems()}
              type="button"
            >
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">Loading...</div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">No announcements.</div>
        ) : (
          <div className="space-y-2">
            {pagedItems.map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-base font-semibold text-slate-900">{item.title}</p>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      item.is_published ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {item.is_published ? "Published" : "Draft"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-700">{item.content}</p>
                <p className="mt-2 text-xs text-slate-500">
                  Created: {formatDate(item.created_at)} | Published: {formatDate(item.published_at)}
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                    onClick={() => startEdit(item)}
                    type="button"
                  >
                    Edit
                  </button>
                  <button
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                    onClick={() => void togglePublish(item)}
                    type="button"
                  >
                    {item.is_published ? "Unpublish" : "Publish"}
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
