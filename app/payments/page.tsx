"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Banknote,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  LoaderCircle,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

type Client = {
  id: string;
  name: string;
  phone: string | null;
  monthly_price: number;
  status: "active" | "inactive";
};

type Payment = {
  id: string;
  client_id: string;
  amount: number;
  billing_month: string;
  payment_date: string;
  payment_method: "cash" | "bank" | "online" | "other";
  notes: string | null;
  created_at: string;
};

type PaymentForm = {
  client_id: string;
  amount: string;
  billing_month: string;
  payment_date: string;
  payment_method: "cash" | "bank" | "online" | "other";
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

function formatMoney(value: number) {
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

const emptyForm = (): PaymentForm => ({
  client_id: "",
  amount: "",
  billing_month: monthStart(localDateString()),
  payment_date: localDateString(),
  payment_method: "cash",
  notes: "",
});

export default function PaymentsPage() {
  const supabase = createClient();
  const [clients, setClients] = useState<Client[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(monthStart(localDateString()));
  const [form, setForm] = useState<PaymentForm>(emptyForm());

  async function loadData() {
    setLoading(true);
    setError("");

    const [clientResult, paymentResult] = await Promise.all([
      supabase
        .from("clients")
        .select("id, name, phone, monthly_price, status")
        .order("name", { ascending: true }),
      supabase
        .from("payments")
        .select("*")
        .order("payment_date", { ascending: false })
        .order("created_at", { ascending: false }),
    ]);

    if (clientResult.error) {
      setError(clientResult.error.message);
    } else {
      setClients((clientResult.data ?? []) as Client[]);
    }

    if (paymentResult.error) {
      setError((current) =>
        current
          ? `${current} | ${paymentResult.error?.message ?? ""}`
          : paymentResult.error?.message ?? ""
      );
    } else {
      setPayments((paymentResult.data ?? []) as Payment[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    void loadData();
    // Load payment records when the page opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const monthPayments = useMemo(
    () => payments.filter((payment) => payment.billing_month === selectedMonth),
    [payments, selectedMonth]
  );

  const paymentTotals = useMemo(() => {
    const received = monthPayments.reduce(
      (total, payment) => total + Number(payment.amount || 0),
      0
    );
    const expected = clients
      .filter((client) => client.status === "active")
      .reduce((total, client) => total + Number(client.monthly_price || 0), 0);
    const paidByClient = new Map<string, number>();

    monthPayments.forEach((payment) => {
      paidByClient.set(
        payment.client_id,
        (paidByClient.get(payment.client_id) ?? 0) + Number(payment.amount || 0)
      );
    });

    const fullyPaidCount = clients.filter(
      (client) =>
        client.status === "active" &&
        (paidByClient.get(client.id) ?? 0) >= Number(client.monthly_price || 0)
    ).length;

    return {
      received,
      expected,
      outstanding: Math.max(expected - received, 0),
      fullyPaidCount,
    };
  }, [clients, monthPayments]);

  const filteredPayments = useMemo(() => {
    const query = search.trim().toLowerCase();
    return monthPayments.filter((payment) => {
      if (!query) return true;
      const client = clients.find((item) => item.id === payment.client_id);
      return [
        client?.name ?? "",
        client?.phone ?? "",
        payment.payment_method,
        payment.notes ?? "",
      ].some((value) => value.toLowerCase().includes(query));
    });
  }, [monthPayments, clients, search]);

  const selectedClient = clients.find((client) => client.id === form.client_id);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const amount = Number(form.amount);
    if (!form.client_id) {
      setError("Pehle client select karo.");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Payment amount zero se zyada enter karo.");
      return;
    }
    if (!form.billing_month || !form.payment_date) {
      setError("Billing month aur payment date select karo.");
      return;
    }

    setSaving(true);
    const payload = {
      client_id: form.client_id,
      amount,
      billing_month: monthStart(form.billing_month),
      payment_date: form.payment_date,
      payment_method: form.payment_method,
      notes: form.notes.trim() || null,
    };

    const { error: insertError } = await supabase.from("payments").insert(payload);

    if (insertError) {
      setError(insertError.message);
    } else {
      setSuccess("Payment successfully record ho gayi.");
      setSelectedMonth(payload.billing_month);
      setForm(emptyForm());
      await loadData();
    }
    setSaving(false);
  }

  async function deletePayment(payment: Payment) {
    const client = clients.find((item) => item.id === payment.client_id);
    const confirmed = window.confirm(
      `${client?.name ?? "Is client"} ki ${formatMoney(Number(payment.amount))} payment delete karni hai?`
    );
    if (!confirmed) return;

    setBusyId(payment.id);
    setError("");
    setSuccess("");

    const { error: deleteError } = await supabase
      .from("payments")
      .delete()
      .eq("id", payment.id);

    if (deleteError) {
      setError(deleteError.message);
    } else {
      setSuccess("Payment record delete ho gaya.");
      await loadData();
    }
    setBusyId(null);
  }

  const activeClients = clients.filter((client) => client.status === "active");

  return (
    <main className="min-h-screen bg-slate-50 p-5 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-cyan-700">1Sip Management</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">Payments</h1>
            <p className="mt-2 text-sm text-slate-500">
              Monthly client payments aur outstanding balance manage karo.
            </p>
          </div>
          <a
            href="/dashboard"
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Dashboard
          </a>
        </div>

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Billing month
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <CalendarDays
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                aria-label="Billing month"
                type="month"
                value={selectedMonth.slice(0, 7)}
                onChange={(event) =>
                  setSelectedMonth(event.target.value ? `${event.target.value}-01` : "")
                }
                className={`${inputClass} pl-10`}
              />
            </div>
            <p className="text-sm text-slate-500">
              Selected month ki payments aur totals yahan show honge.
            </p>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Expected Monthly Revenue"
            value={formatMoney(paymentTotals.expected)}
            icon={<CircleDollarSign size={22} />}
            tone="cyan"
          />
          <StatCard
            label="Payments Received"
            value={formatMoney(paymentTotals.received)}
            icon={<Banknote size={22} />}
            tone="emerald"
          />
          <StatCard
            label="Outstanding Balance"
            value={formatMoney(paymentTotals.outstanding)}
            icon={<CircleDollarSign size={22} />}
            tone="amber"
          />
          <StatCard
            label="Fully Paid Clients"
            value={`${paymentTotals.fullyPaidCount} / ${activeClients.length}`}
            icon={<CheckCircle2 size={22} />}
            tone="violet"
          />
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}
        {success && (
          <div
            role="status"
            className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
          >
            {success}
          </div>
        )}

        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-cyan-50 p-3 text-cyan-700">
              <Plus size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Record a payment</h2>
              <p className="text-sm text-slate-500">
                Full payment ya partial payment, dono record kar sakte ho.
              </p>
            </div>
          </div>

          {activeClients.length === 0 && !loading ? (
            <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
              Payment record karne ke liye pehle Clients page par active client add karo.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Client</label>
                <select
                  required
                  value={form.client_id}
                  onChange={(event) => setForm({ ...form, client_id: event.target.value })}
                  className={inputClass}
                >
                  <option value="">Client select karo</option>
                  {activeClients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} , {formatMoney(Number(client.monthly_price))}
                    </option>
                  ))}
                </select>
                {selectedClient && (
                  <p className="mt-2 text-xs text-slate-500">
                    Monthly charge: {formatMoney(Number(selectedClient.monthly_price))}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Amount (PKR)</label>
                <input
                  required
                  min="1"
                  step="0.01"
                  type="number"
                  inputMode="decimal"
                  value={form.amount}
                  onChange={(event) => setForm({ ...form, amount: event.target.value })}
                  placeholder="e.g. 2500"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Billing month</label>
                <input
                  required
                  type="month"
                  value={form.billing_month.slice(0, 7)}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      billing_month: event.target.value ? `${event.target.value}-01` : "",
                    })
                  }
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Payment date</label>
                <input
                  required
                  type="date"
                  value={form.payment_date}
                  max={localDateString()}
                  onChange={(event) => setForm({ ...form, payment_date: event.target.value })}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Payment method</label>
                <select
                  value={form.payment_method}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      payment_method: event.target.value as PaymentForm["payment_method"],
                    })
                  }
                  className={inputClass}
                >
                  <option value="cash">Cash</option>
                  <option value="bank">Bank transfer</option>
                  <option value="online">Online payment</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Notes (optional)</label>
                <input
                  value={form.notes}
                  onChange={(event) => setForm({ ...form, notes: event.target.value })}
                  placeholder="e.g. Paid through Easypaisa"
                  className={inputClass}
                />
              </div>

              <div className="md:col-span-2 xl:col-span-3">
                <button
                  disabled={saving || loading}
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-700 px-5 py-3 font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? <LoaderCircle size={18} className="animate-spin" /> : <Plus size={18} />}
                  {saving ? "Saving payment..." : "Save payment"}
                </button>
              </div>
            </form>
          )}
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Payment history</h2>
              <p className="mt-1 text-sm text-slate-500">
                {monthPayments.length} payment records for {selectedMonth.slice(0, 7)}
              </p>
            </div>
            <div className="relative w-full sm:max-w-xs">
              <Search
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search client or method"
                className={`${inputClass} pl-10`}
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 p-12 text-slate-500">
              <LoaderCircle size={22} className="animate-spin" />
              Loading payments...
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <Banknote size={23} />
              </div>
              <h3 className="font-semibold text-slate-900">No payments found</h3>
              <p className="mt-1 text-sm text-slate-500">
                Is month ke liye payment record nahi hai, ya search se match nahi mila.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Client</th>
                    <th className="px-5 py-4 font-semibold">Amount</th>
                    <th className="px-5 py-4 font-semibold">Payment date</th>
                    <th className="px-5 py-4 font-semibold">Method</th>
                    <th className="px-5 py-4 font-semibold">Notes</th>
                    <th className="px-5 py-4 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPayments.map((payment) => {
                    const client = clients.find((item) => item.id === payment.client_id);
                    return (
                      <tr key={payment.id} className="hover:bg-slate-50">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-900">{client?.name ?? "Unknown client"}</p>
                          <p className="mt-1 text-xs text-slate-500">{client?.phone || "No phone"}</p>
                        </td>
                        <td className="px-5 py-4 font-semibold text-emerald-700">
                          {formatMoney(Number(payment.amount))}
                        </td>
                        <td className="px-5 py-4 text-slate-600">{formatDate(payment.payment_date)}</td>
                        <td className="px-5 py-4">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">
                            {payment.payment_method === "bank"
                              ? "Bank transfer"
                              : payment.payment_method}
                          </span>
                        </td>
                        <td className="max-w-xs truncate px-5 py-4 text-slate-500">
                          {payment.notes || "No notes"}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            disabled={busyId === payment.id}
                            onClick={() => void deletePayment(payment)}
                            aria-label="Delete payment"
                            className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                          >
                            {busyId === payment.id ? (
                              <LoaderCircle size={15} className="animate-spin" />
                            ) : (
                              <Trash2 size={15} />
                            )}
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="mt-5 flex items-start gap-3 rounded-xl border border-cyan-100 bg-cyan-50 p-4 text-sm text-cyan-900">
          <X size={18} className="mt-0.5 shrink-0" />
          <p>
            Outstanding balance active clients ke monthly charges se calculate hota hai.
            Agar kisi client ne partial payment ki hai, uska remaining amount isi total mein shamil rahega.
            Payment history ko hamesha selected billing month ke mutabiq check karo.
          </p>
        </div>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: "cyan" | "emerald" | "amber" | "violet";
}) {
  const tones = {
    cyan: "bg-cyan-50 text-cyan-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    violet: "bg-violet-50 text-violet-700",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-3">
        <div className={`rounded-xl p-3 ${tones[tone]}`}>{icon}</div>
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
        </div>
      </div>
    </div>
  );
}
