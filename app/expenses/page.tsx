"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Plus,
  Receipt,
  LoaderCircle,
  Search,
  Trash2,
  CalendarDays,
  TrendingDown,
  Wallet,
  Pencil,
  X,
} from "lucide-react";

type Expense = {
  id: string;
  title: string;
  category: string;
  amount: number;
  expense_date: string;
  notes: string | null;
  created_at: string;
};

type ExpenseForm = {
  title: string;
  category: string;
  amount: string;
  expense_date: string;
  notes: string;
};

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function monthStart(value: string) {
  return value ? `${value.slice(0, 7)}-01` : "";
}

function money(value: number) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatDate(value: string) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value.slice(0, 10)}T00:00:00Z`));
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100";

const categories = [
  "Fuel",
  "Vehicle Maintenance",
  "Bottle Purchase",
  "Bottle Cleaning",
  "Staff Salary",
  "Rent",
  "Electricity",
  "Water Supply",
  "Packaging",
  "Marketing",
  "Other",
];

const emptyForm = (): ExpenseForm => ({
  title: "",
  category: "Fuel",
  amount: "",
  expense_date: localDateString(),
  notes: "",
});

export default function ExpensesPage() {
  const supabase = createClient();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(monthStart(localDateString()));
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [form, setForm] = useState<ExpenseForm>(emptyForm());

  async function loadExpenses() {
    setLoading(true);
    setError("");
    const { data, error: loadError } = await supabase
      .from("expenses")
      .select("*")
      .order("expense_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (loadError) setError(loadError.message);
    else setExpenses((data ?? []) as Expense[]);
    setLoading(false);
  }

  useEffect(() => {
    void loadExpenses();
    // Load expenses once when this page opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const monthExpenses = useMemo(
    () => expenses.filter((expense) => expense.expense_date.slice(0, 7) === selectedMonth.slice(0, 7)),
    [expenses, selectedMonth]
  );

  const visibleExpenses = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return monthExpenses;
    return monthExpenses.filter((expense) =>
      [expense.title, expense.category, expense.notes ?? ""].some((value) =>
        value.toLowerCase().includes(query)
      )
    );
  }, [monthExpenses, search]);

  const totalExpense = monthExpenses.reduce(
    (sum, expense) => sum + Number(expense.amount || 0),
    0
  );

  const categoryTotals = useMemo(() => {
    const totals = new Map<string, number>();
    monthExpenses.forEach((expense) => {
      totals.set(expense.category, (totals.get(expense.category) ?? 0) + Number(expense.amount || 0));
    });
    return [...totals.entries()].sort((a, b) => b[1] - a[1]);
  }, [monthExpenses]);

  function resetForm() {
    setEditingExpense(null);
    setForm(emptyForm());
  }

  function startEditing(expense: Expense) {
    setEditingExpense(expense);
    setForm({
      title: expense.title,
      category: expense.category,
      amount: String(expense.amount),
      expense_date: expense.expense_date,
      notes: expense.notes ?? "",
    });
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const amount = Number(form.amount);
    if (!form.title.trim()) {
      setError("Expense ka title enter karo.");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Expense amount zero se zyada hona chahiye.");
      return;
    }
    if (!form.expense_date) {
      setError("Expense date select karo.");
      return;
    }

    setSaving(true);
    const payload = {
      title: form.title.trim(),
      category: form.category,
      amount,
      expense_date: form.expense_date,
      notes: form.notes.trim() || null,
    };

    const result = editingExpense
      ? await supabase.from("expenses").update(payload).eq("id", editingExpense.id)
      : await supabase.from("expenses").insert(payload);

    if (result.error) {
      setError(result.error.message);
    } else {
      setSuccess(editingExpense ? "Expense update ho gaya." : "Expense successfully add ho gaya.");
      setSelectedMonth(monthStart(payload.expense_date));
      resetForm();
      await loadExpenses();
    }
    setSaving(false);
  }

  async function deleteExpense(expense: Expense) {
    if (!window.confirm(`${expense.title} ka ${money(Number(expense.amount))} expense delete karna hai?`)) return;

    setBusyId(expense.id);
    setError("");
    setSuccess("");

    const { error: deleteError } = await supabase
      .from("expenses")
      .delete()
      .eq("id", expense.id);

    if (deleteError) setError(deleteError.message);
    else {
      setSuccess("Expense delete ho gaya.");
      if (editingExpense?.id === expense.id) resetForm();
      await loadExpenses();
    }
    setBusyId(null);
  }

  return (
    <main className="min-h-screen bg-slate-50 p-5 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-cyan-700">1Sip Management</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">Expenses</h1>
            <p className="mt-2 text-sm text-slate-500">Business ke monthly expenses record aur manage karo.</p>
          </div>
          <a href="/dashboard" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100">Dashboard</a>
        </div>

        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-cyan-50 p-3 text-cyan-700"><Plus size={22} /></div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{editingExpense ? "Edit expense" : "Add an expense"}</h2>
              <p className="text-sm text-slate-500">Fuel, salaries, bottles, rent aur doosre business costs.</p>
            </div>
          </div>

          {error && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
          {success && <div role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{success}</div>}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Expense title</label>
              <input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="e.g. Bike fuel" className={inputClass} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Category</label>
              <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className={inputClass}>
                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Amount (PKR)</label>
              <input required min="1" step="0.01" type="number" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} placeholder="e.g. 1500" className={inputClass} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Expense date</label>
              <input required type="date" max={localDateString()} value={form.expense_date} onChange={(event) => setForm({ ...form, expense_date: event.target.value })} className={inputClass} />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">Notes (optional)</label>
              <input value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Any extra details" className={inputClass} />
            </div>
            <div className="flex flex-wrap items-center gap-3 md:col-span-2 xl:col-span-3">
              <button disabled={saving} type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-700 px-5 py-3 font-semibold text-white hover:bg-cyan-800 disabled:opacity-60">
                {saving ? <LoaderCircle size={18} className="animate-spin" /> : <Plus size={18} />}
                {saving ? "Saving..." : editingExpense ? "Update expense" : "Save expense"}
              </button>
              {editingExpense && <button type="button" onClick={resetForm} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50"><X size={17} /> Cancel edit</button>}
            </div>
          </form>
        </section>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryCard title="Monthly Expenses" amount={money(totalExpense)} icon={<TrendingDown size={22} />} />
          <SummaryCard title="Expense Records" amount={String(monthExpenses.length)} icon={<Receipt size={22} />} />
          <SummaryCard title="Average Expense" amount={money(monthExpenses.length ? totalExpense / monthExpenses.length : 0)} icon={<Wallet size={22} />} />
        </div>

        <section className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Expense history</h2>
              <p className="mt-1 text-sm text-slate-500">Selected month ke expense records.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <CalendarDays size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="month" aria-label="Expense month" value={selectedMonth.slice(0, 7)} onChange={(event) => setSelectedMonth(event.target.value ? `${event.target.value}-01` : "")} className="rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-slate-900 outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100" />
              </div>
              <div className="relative">
                <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search expenses" className="rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-slate-900 outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100" />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 p-12 text-slate-500"><LoaderCircle size={22} className="animate-spin" /> Loading expenses...</div>
          ) : visibleExpenses.length === 0 ? (
            <div className="p-12 text-center"><Receipt size={30} className="mx-auto mb-3 text-slate-400" /><h3 className="font-semibold text-slate-900">No expenses found</h3><p className="mt-1 text-sm text-slate-500">Is month mein abhi expense record nahi hai.</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-4 font-semibold">Expense</th><th className="px-5 py-4 font-semibold">Category</th><th className="px-5 py-4 font-semibold">Date</th><th className="px-5 py-4 font-semibold">Amount</th><th className="px-5 py-4 font-semibold">Notes</th><th className="px-5 py-4 text-right font-semibold">Actions</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleExpenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4 font-semibold text-slate-900">{expense.title}</td>
                      <td className="px-5 py-4"><span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-800">{expense.category}</span></td>
                      <td className="px-5 py-4 text-slate-600">{formatDate(expense.expense_date)}</td>
                      <td className="px-5 py-4 font-semibold text-slate-900">{money(Number(expense.amount))}</td>
                      <td className="max-w-xs truncate px-5 py-4 text-slate-500">{expense.notes || "No notes"}</td>
                      <td className="px-5 py-4 text-right"><div className="inline-flex gap-2">
                        <button type="button" onClick={() => startEditing(expense)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"><Pencil size={14} /> Edit</button>
                        <button type="button" disabled={busyId === expense.id} onClick={() => void deleteExpense(expense)} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">
                          {busyId === expense.id ? <LoaderCircle size={14} className="animate-spin" /> : <Trash2 size={14} />} Delete
                        </button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold text-slate-900">Expenses by category</h2>
          <p className="mt-1 text-sm text-slate-500">Selected month ka category wise breakdown.</p>
          {categoryTotals.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">Expense add karne ke baad breakdown yahan show hoga.</p>
          ) : (
            <div className="mt-5 space-y-4">
              {categoryTotals.map(([category, amount]) => (
                <div key={category}>
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-slate-700">{category}</span>
                    <span className="font-semibold text-slate-900">{money(amount)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-cyan-600" style={{ width: `${totalExpense ? (amount / totalExpense) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function SummaryCard({
  title,
  amount,
  icon,
}: {
  title: string;
  amount: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-cyan-50 p-3 text-cyan-700">{icon}</div>
        <div><p className="text-sm text-slate-500">{title}</p><p className="mt-1 text-xl font-bold text-slate-900">{amount}</p></div>
      </div>
    </div>
  );
}
