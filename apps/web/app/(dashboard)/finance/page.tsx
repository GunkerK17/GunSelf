"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { Database } from "@gunself/types";

import { supabase } from "@/lib/supabase/client";

type FinanceLog = Database["public"]["Tables"]["finance_logs"]["Row"];

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

function localDateTimeInputValue(date = new Date()) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export default function FinancePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [items, setItems] = useState<FinanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [form, setForm] = useState({
    type: "expense",
    category: "",
    amount: "",
    currency: "VND",
    note: "",
    loggedAt: localDateTimeInputValue()
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
      .from("finance_logs")
      .select("*")
      .eq("user_id", session.user.id)
      .order("logged_at", { ascending: false })
      .limit(120);

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

    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Amount must be greater than 0.");
      return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);

    const { data, error: insertError } = await supabase
      .from("finance_logs")
      .insert({
        user_id: userId,
        type: form.type,
        category: form.category.trim() || null,
        amount,
        currency: form.currency.trim() || "VND",
        note: form.note.trim() || null,
        logged_at: new Date(form.loggedAt).toISOString()
      })
      .select("*")
      .single();

    if (insertError || !data) {
      setError(insertError?.message ?? "Create finance log failed.");
      setSaving(false);
      return;
    }

    setItems((prev) => [data, ...prev]);
    setForm({
      type: "expense",
      category: "",
      amount: "",
      currency: "VND",
      note: "",
      loggedAt: localDateTimeInputValue()
    });
    setSaving(false);
    setNotice("Finance log saved.");
  }

  async function removeItem(item: FinanceLog) {
    const confirmed = window.confirm("Delete this finance log?");
    if (!confirmed) return;

    const { error: deleteError } = await supabase.from("finance_logs").delete().eq("id", item.id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setItems((prev) => prev.filter((x) => x.id !== item.id));
    setNotice("Finance log deleted.");
  }

  const summary = useMemo(() => {
    const income = items.filter((item) => item.type === "income").reduce((acc, item) => acc + Number(item.amount ?? 0), 0);
    const expense = items.filter((item) => item.type !== "income").reduce((acc, item) => acc + Number(item.amount ?? 0), 0);
    return {
      total: items.length,
      income,
      expense,
      balance: income - expense
    };
  }, [items]);

  return (
    <section className="space-y-4">
      <header className="gs-client-panel gs-client-panel-3d rounded-2xl p-6">
        <h1 className="text-2xl font-semibold text-[#0f172a]">Finance</h1>
        <p className="mt-2 text-slate-600">Track income and expenses by category and time.</p>
      </header>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</div>}

      <div className="grid gap-3 md:grid-cols-4">
        <article className="gs-client-panel gs-client-panel-3d rounded-xl p-4">
          <p className="text-xs text-slate-500">Logs</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{summary.total}</p>
        </article>
        <article className="gs-client-panel gs-client-panel-3d rounded-xl p-4">
          <p className="text-xs text-slate-500">Income</p>
          <p className="mt-2 text-2xl font-bold text-emerald-700">{summary.income.toLocaleString()}</p>
        </article>
        <article className="gs-client-panel gs-client-panel-3d rounded-xl p-4">
          <p className="text-xs text-slate-500">Expense</p>
          <p className="mt-2 text-2xl font-bold text-rose-700">{summary.expense.toLocaleString()}</p>
        </article>
        <article className="gs-client-panel gs-client-panel-3d rounded-xl p-4">
          <p className="text-xs text-slate-500">Balance</p>
          <p className={`mt-2 text-2xl font-bold ${summary.balance >= 0 ? "text-emerald-700" : "text-rose-700"}`}>{summary.balance.toLocaleString()}</p>
        </article>
      </div>

      <article className="gs-client-panel gs-client-panel-3d rounded-2xl p-4">
        <h2 className="mb-2 text-lg font-semibold text-slate-900">Add Finance Log</h2>
        <form className="grid gap-2 md:grid-cols-6" onSubmit={(event) => void handleSubmit(event)}>
          <select
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}
            value={form.type}
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
          <input
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
            placeholder="Category"
            value={form.category}
          />
          <input
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            min={0}
            onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))}
            placeholder="Amount"
            step="0.01"
            type="number"
            value={form.amount}
          />
          <input
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            onChange={(event) => setForm((prev) => ({ ...prev, currency: event.target.value.toUpperCase() }))}
            placeholder="Currency"
            value={form.currency}
          />
          <input
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            onChange={(event) => setForm((prev) => ({ ...prev, loggedAt: event.target.value }))}
            type="datetime-local"
            value={form.loggedAt}
          />
          <button
            className="rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
            disabled={saving}
            type="submit"
          >
            {saving ? "Saving..." : "Save Finance"}
          </button>
          <textarea
            className="md:col-span-6 min-h-20 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
            placeholder="Note"
            value={form.note}
          />
        </form>
      </article>

      <article className="gs-client-panel gs-client-panel-3d rounded-2xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Recent Finance Logs</h2>
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
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">No finance logs yet.</div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="gs-client-panel rounded-xl p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {item.type.toUpperCase()} {Number(item.amount).toLocaleString()} {item.currency ?? ""}
                    </p>
                    <p className="text-xs text-slate-600">
                      {formatDateTime(item.logged_at)} | {item.category ?? "No category"}
                    </p>
                    {item.note && <p className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">{item.note}</p>}
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
