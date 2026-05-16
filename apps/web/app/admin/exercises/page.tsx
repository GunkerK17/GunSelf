"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { Database, Json } from "@gunself/types";

import { supabase } from "@/lib/supabase/client";

type Exercise = Database["public"]["Tables"]["exercise_library"]["Row"];

const PAGE_SIZE = 10;

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

export default function AdminExercisesPage() {
  const [items, setItems] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [muscleFilter, setMuscleFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    category: "",
    muscleGroup: ""
  });

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: loadError } = await supabase
      .from("exercise_library")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

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
      entity: "exercise",
      message,
      metadata
    });
  }

  const categoryOptions = useMemo(() => {
    const values = Array.from(new Set(items.map((item) => item.category).filter((value): value is string => !!value))).sort();
    return ["all", ...values];
  }, [items]);

  const muscleOptions = useMemo(() => {
    const values = Array.from(new Set(items.map((item) => item.muscle_group).filter((value): value is string => !!value))).sort();
    return ["all", ...values];
  }, [items]);

  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return items.filter((item) => {
      if (categoryFilter !== "all" && (item.category ?? "") !== categoryFilter) {
        return false;
      }
      if (muscleFilter !== "all" && (item.muscle_group ?? "") !== muscleFilter) {
        return false;
      }
      if (!keyword) {
        return true;
      }

      const haystack = `${item.name} ${item.category ?? ""} ${item.muscle_group ?? ""}`.toLowerCase();
      return haystack.includes(keyword);
    });
  }, [items, search, categoryFilter, muscleFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedItems = filteredItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function resetForm() {
    setEditingId(null);
    setForm({ name: "", category: "", muscleGroup: "" });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (!form.name.trim()) {
      setError("Exercise name is required.");
      return;
    }

    setSaving(true);

    if (editingId) {
      const { data, error: updateError } = await supabase
        .from("exercise_library")
        .update({
          name: form.name.trim(),
          category: form.category.trim() || null,
          muscle_group: form.muscleGroup.trim() || null
        })
        .eq("id", editingId)
        .select("*")
        .single();

      if (updateError || !data) {
        setError(updateError?.message ?? "Update failed.");
        setSaving(false);
        return;
      }

      setItems((prev) => prev.map((item) => (item.id === editingId ? data : item)));
      await logAction("update", `Updated exercise ${data.name}`, { id: data.id });
      setNotice("Exercise updated.");
      resetForm();
      setSaving(false);
      return;
    }

    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session?.user.id) {
      setError("Session expired. Please login again.");
      setSaving(false);
      return;
    }

    const { data, error: createError } = await supabase
      .from("exercise_library")
      .insert({
        user_id: session.user.id,
        name: form.name.trim(),
        category: form.category.trim() || null,
        muscle_group: form.muscleGroup.trim() || null
      })
      .select("*")
      .single();

    if (createError || !data) {
      setError(createError?.message ?? "Create failed.");
      setSaving(false);
      return;
    }

    setItems((prev) => [data, ...prev]);
    await logAction("create", `Created exercise ${data.name}`, { id: data.id });
    setNotice("Exercise created.");
    resetForm();
    setSaving(false);
    setPage(1);
  }

  function startEdit(item: Exercise) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      category: item.category ?? "",
      muscleGroup: item.muscle_group ?? ""
    });
    setError(null);
    setNotice(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function removeItem(item: Exercise) {
    const confirmed = window.confirm(`Delete exercise \"${item.name}\"?`);
    if (!confirmed) {
      return;
    }

    setError(null);
    setNotice(null);

    const { error: deleteError } = await supabase.from("exercise_library").delete().eq("id", item.id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setItems((prev) => prev.filter((x) => x.id !== item.id));
    await logAction("delete", `Deleted exercise ${item.name}`, { id: item.id });
    setNotice("Exercise deleted.");
    if (editingId === item.id) {
      resetForm();
    }
  }

  return (
    <section className="space-y-4">
      <header className="gs-admin-tile rounded-3xl border border-slate-300 bg-white p-5">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Exercise Library</h1>
        <p className="mt-1 text-sm text-slate-600">Manage reusable exercises used by web and mobile tracking forms.</p>
      </header>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</div>}

      <article className="gs-admin-tile rounded-2xl border border-slate-300 bg-white p-4">
        <h2 className="mb-2 text-lg font-semibold text-slate-900">{editingId ? "Edit exercise" : "Create exercise"}</h2>
        <form className="grid gap-2 md:grid-cols-4" onSubmit={(event) => void handleSubmit(event)}>
          <input
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="Exercise name"
            value={form.name}
          />
          <input
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
            placeholder="Category (e.g. Strength)"
            value={form.category}
          />
          <input
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            onChange={(event) => setForm((prev) => ({ ...prev, muscleGroup: event.target.value }))}
            placeholder="Muscle group (e.g. Chest)"
            value={form.muscleGroup}
          />
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
        </form>
      </article>

      <article className="gs-admin-tile rounded-2xl border border-slate-300 bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-900">Exercise list</h2>
          <div className="flex flex-wrap items-center gap-2">
            <input
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700"
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search exercise..."
              value={search}
            />
            <select
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700"
              onChange={(event) => {
                setCategoryFilter(event.target.value);
                setPage(1);
              }}
              value={categoryFilter}
            >
              {categoryOptions.map((item) => (
                <option key={item} value={item}>
                  Category: {item}
                </option>
              ))}
            </select>
            <select
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700"
              onChange={(event) => {
                setMuscleFilter(event.target.value);
                setPage(1);
              }}
              value={muscleFilter}
            >
              {muscleOptions.map((item) => (
                <option key={item} value={item}>
                  Muscle: {item}
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
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">No exercises yet.</div>
        ) : (
          <>
            <div className="hidden overflow-x-auto rounded-xl border border-slate-200 md:block">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100 text-slate-600">
                  <tr>
                    <th className="px-3 py-2 text-left">Name</th>
                    <th className="px-3 py-2 text-left">Category</th>
                    <th className="px-3 py-2 text-left">Muscle Group</th>
                    <th className="px-3 py-2 text-left">Created</th>
                    <th className="px-3 py-2 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedItems.map((item) => (
                    <tr key={item.id} className="border-t border-slate-200 bg-white">
                      <td className="px-3 py-2 font-semibold text-slate-900">{item.name}</td>
                      <td className="px-3 py-2 text-slate-700">{item.category || "-"}</td>
                      <td className="px-3 py-2 text-slate-700">{item.muscle_group || "-"}</td>
                      <td className="px-3 py-2 text-slate-600">{formatDate(item.created_at)}</td>
                      <td className="px-3 py-2">
                        <div className="flex gap-2">
                          <button
                            className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700"
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-2 md:hidden">
              {pagedItems.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-base font-semibold text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-600">Category: {item.category || "-"}</p>
                  <p className="text-xs text-slate-600">Muscle: {item.muscle_group || "-"}</p>
                  <p className="text-xs text-slate-500">Created: {formatDate(item.created_at)}</p>
                  <div className="mt-2 flex gap-2">
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
