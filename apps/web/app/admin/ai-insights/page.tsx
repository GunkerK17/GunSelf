"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { Database, Json } from "@gunself/types";

import { supabase } from "@/lib/supabase/client";

type PromptItem = Database["public"]["Tables"]["ai_notes"]["Row"];

const PROMPT_PREFIX = "prompt:";
const PAGE_SIZE = 8;

const MODULES = ["general", "workout", "nutrition", "sleep", "mood", "goals", "finance"];
const TONES = ["coach", "strict", "supportive", "analytical"];

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

function parseContext(context: string | null) {
  const fallback = { module: "general", tone: "coach" };
  if (!context || !context.startsWith(PROMPT_PREFIX)) {
    return fallback;
  }
  const parts = context.slice(PROMPT_PREFIX.length).split(":");
  return {
    module: parts[0] || "general",
    tone: parts[1] || "coach"
  };
}

export default function AdminAiInsightsPage() {
  const [items, setItems] = useState<PromptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [toneFilter, setToneFilter] = useState("all");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    content: "",
    module: "general",
    tone: "coach"
  });

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);

    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session?.user.id) {
      setError("Session expired.");
      setItems([]);
      setLoading(false);
      return;
    }

    const { data, error: loadError } = await supabase
      .from("ai_notes")
      .select("*")
      .eq("user_id", session.user.id)
      .like("context", `${PROMPT_PREFIX}%`)
      .order("created_at", { ascending: false })
      .limit(300);

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

  async function logAction(action: string, message: string, metadata: Json) {
    const {
      data: { session }
    } = await supabase.auth.getSession();

    await supabase.from("admin_audit_logs").insert({
      actor_user_id: session?.user.id ?? null,
      action,
      entity: "ai_prompt",
      message,
      metadata
    });
  }

  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return items.filter((item) => {
      const parsed = parseContext(item.context);

      if (moduleFilter !== "all" && parsed.module !== moduleFilter) {
        return false;
      }
      if (toneFilter !== "all" && parsed.tone !== toneFilter) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      const haystack = `${item.title ?? ""} ${item.content} ${parsed.module} ${parsed.tone}`.toLowerCase();
      return haystack.includes(keyword);
    });
  }, [items, search, moduleFilter, toneFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedItems = filteredItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function resetForm() {
    setEditingId(null);
    setForm({ title: "", content: "", module: "general", tone: "coach" });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (!form.title.trim() || !form.content.trim()) {
      setError("Title and prompt body are required.");
      return;
    }

    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session?.user.id) {
      setError("Session expired.");
      return;
    }

    setSaving(true);

    if (editingId) {
      const { data, error: updateError } = await supabase
        .from("ai_notes")
        .update({
          title: form.title.trim(),
          content: form.content.trim(),
          context: `${PROMPT_PREFIX}${form.module}:${form.tone}`
        })
        .eq("id", editingId)
        .eq("user_id", session.user.id)
        .select("*")
        .single();

      if (updateError || !data) {
        setError(updateError?.message ?? "Update failed.");
        setSaving(false);
        return;
      }

      setItems((prev) => prev.map((item) => (item.id === editingId ? data : item)));
      await logAction("update", `Updated AI prompt ${data.title ?? data.id}`, { id: data.id });
      setNotice("Prompt updated.");
      setSaving(false);
      resetForm();
      return;
    }

    const { data, error: createError } = await supabase
      .from("ai_notes")
      .insert({
        user_id: session.user.id,
        title: form.title.trim(),
        content: form.content.trim(),
        context: `${PROMPT_PREFIX}${form.module}:${form.tone}`
      })
      .select("*")
      .single();

    if (createError || !data) {
      setError(createError?.message ?? "Create failed.");
      setSaving(false);
      return;
    }

    setItems((prev) => [data, ...prev]);
    await logAction("create", `Created AI prompt ${data.title ?? data.id}`, { id: data.id });
    setNotice("Prompt created.");
    setSaving(false);
    setPage(1);
    resetForm();
  }

  function startEdit(item: PromptItem) {
    const parsed = parseContext(item.context);
    setEditingId(item.id);
    setForm({
      title: item.title ?? "",
      content: item.content,
      module: parsed.module,
      tone: parsed.tone
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function removeItem(item: PromptItem) {
    const confirmed = window.confirm(`Delete prompt \"${item.title ?? item.id}\"?`);
    if (!confirmed) {
      return;
    }

    const { error: deleteError } = await supabase.from("ai_notes").delete().eq("id", item.id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setItems((prev) => prev.filter((x) => x.id !== item.id));
    await logAction("delete", `Deleted AI prompt ${item.title ?? item.id}`, { id: item.id });
    setNotice("Prompt deleted.");
  }

  return (
    <section className="space-y-4">
      <header className="gs-admin-tile rounded-3xl border border-slate-300 bg-white p-5">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">AI Insights & Prompts</h1>
        <p className="mt-1 text-sm text-slate-600">Manage prompt templates by module and tone for future AI coaching.</p>
      </header>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</div>}

      <article className="gs-admin-tile rounded-2xl border border-slate-300 bg-white p-4">
        <h2 className="mb-2 text-lg font-semibold text-slate-900">{editingId ? "Edit prompt" : "Create prompt"}</h2>
        <form className="grid gap-2" onSubmit={(event) => void handleSubmit(event)}>
          <div className="grid gap-2 md:grid-cols-4">
            <input
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Prompt title"
              value={form.title}
            />
            <select
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              onChange={(event) => setForm((prev) => ({ ...prev, module: event.target.value }))}
              value={form.module}
            >
              {MODULES.map((item) => (
                <option key={item} value={item}>
                  Module: {item}
                </option>
              ))}
            </select>
            <select
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              onChange={(event) => setForm((prev) => ({ ...prev, tone: event.target.value }))}
              value={form.tone}
            >
              {TONES.map((item) => (
                <option key={item} value={item}>
                  Tone: {item}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                className="rounded-lg border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                disabled={saving}
                type="submit"
              >
                {saving ? "Saving..." : editingId ? "Update" : "Create"}
              </button>
              {editingId && (
                <button
                  className="rounded-lg border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700"
                  onClick={resetForm}
                  type="button"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
          <textarea
            className="min-h-32 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
            placeholder="Prompt body"
            value={form.content}
          />
        </form>
      </article>

      <article className="gs-admin-tile rounded-2xl border border-slate-300 bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-900">Prompt list</h2>
          <div className="flex flex-wrap items-center gap-2">
            <input
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700"
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search prompt..."
              value={search}
            />
            <select
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700"
              onChange={(event) => {
                setModuleFilter(event.target.value);
                setPage(1);
              }}
              value={moduleFilter}
            >
              <option value="all">Module: all</option>
              {MODULES.map((item) => (
                <option key={item} value={item}>
                  Module: {item}
                </option>
              ))}
            </select>
            <select
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700"
              onChange={(event) => {
                setToneFilter(event.target.value);
                setPage(1);
              }}
              value={toneFilter}
            >
              <option value="all">Tone: all</option>
              {TONES.map((item) => (
                <option key={item} value={item}>
                  Tone: {item}
                </option>
              ))}
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
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">No prompts yet.</div>
        ) : (
          <div className="space-y-2">
            {pagedItems.map((item) => {
              const parsed = parseContext(item.context);
              return (
                <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-base font-semibold text-slate-900">{item.title || "Untitled"}</p>
                    <div className="flex gap-1">
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700">{parsed.module}</span>
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">{parsed.tone}</span>
                    </div>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{item.content}</p>
                  <p className="mt-2 text-xs text-slate-500">Created: {formatDate(item.created_at)}</p>
                  <div className="mt-3 flex gap-2">
                    <button
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                      onClick={() => startEdit(item)}
                      type="button"
                    >
                      Edit
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
              );
            })}
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
