"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import type { Database } from "@gunself/types";

import { supabase } from "@/lib/supabase/client";

type AiNote = Database["public"]["Tables"]["ai_notes"]["Row"];

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

export default function AICoachPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [items, setItems] = useState<AiNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    context: "",
    content: ""
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
      .from("ai_notes")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(80);

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

    if (!form.content.trim()) {
      setError("Note content is required.");
      return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);

    const { data, error: insertError } = await supabase
      .from("ai_notes")
      .insert({
        user_id: userId,
        title: form.title.trim() || null,
        context: form.context.trim() || null,
        content: form.content.trim()
      })
      .select("*")
      .single();

    if (insertError || !data) {
      setError(insertError?.message ?? "Create AI note failed.");
      setSaving(false);
      return;
    }

    setItems((prev) => [data, ...prev]);
    setForm({ title: "", context: "", content: "" });
    setSaving(false);
    setNotice("AI note saved.");
  }

  async function removeItem(item: AiNote) {
    const confirmed = window.confirm("Delete this AI note?");
    if (!confirmed) return;

    const { error: deleteError } = await supabase.from("ai_notes").delete().eq("id", item.id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setItems((prev) => prev.filter((x) => x.id !== item.id));
    setNotice("AI note deleted.");
  }

  return (
    <section className="space-y-4">
      <header className="gs-client-panel gs-client-panel-3d rounded-2xl p-6">
        <h1 className="text-2xl font-semibold text-[#0f172a]">AI Coach</h1>
        <p className="mt-2 text-slate-600">Save your prompts, insights, and reflection notes for future coaching.</p>
      </header>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</div>}

      <article className="gs-client-panel gs-client-panel-3d rounded-2xl p-4">
        <h2 className="mb-2 text-lg font-semibold text-slate-900">New AI Note</h2>
        <form className="grid gap-2" onSubmit={(event) => void handleSubmit(event)}>
          <div className="grid gap-2 md:grid-cols-2">
            <input
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Title (optional)"
              value={form.title}
            />
            <input
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              onChange={(event) => setForm((prev) => ({ ...prev, context: event.target.value }))}
              placeholder="Context (workout, nutrition, mood...)"
              value={form.context}
            />
          </div>
          <textarea
            className="min-h-28 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
            placeholder="Write the insight / prompt / reflection"
            value={form.content}
          />
          <button
            className="rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
            disabled={saving}
            type="submit"
          >
            {saving ? "Saving..." : "Save AI Note"}
          </button>
        </form>
      </article>

      <article className="gs-client-panel gs-client-panel-3d rounded-2xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">AI Notes</h2>
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
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">No AI notes yet.</div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="gs-client-panel rounded-xl p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{item.title ?? "Untitled note"}</p>
                    <p className="text-xs text-slate-600">
                      {formatDateTime(item.created_at)} {item.context ? `| ${item.context}` : ""}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{item.content}</p>
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
