"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock3,
  LoaderCircle,
  Search,
  Truck,
} from "lucide-react";

type Client = {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  bottles_per_day: number;
  status: "active" | "inactive";
};

type Delivery = {
  id: string;
  client_id: string;
  delivery_date: string;
  bottles_delivered: number;
  status: "pending" | "delivered" | "missed";
  notes: string | null;
};

type DeliveryRow = {
  client: Client;
  delivery: Delivery | null;
  bottles: string;
  notes: string;
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100";

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function DeliveriesPage() {
  const supabase = createClient();
  const [clients, setClients] = useState<Client[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [date, setDate] = useState(localDateString());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [drafts, setDrafts] = useState<Record<string, { bottles: string; notes: string }>>({});

  async function loadData(selectedDate = date) {
    setLoading(true);
    setError("");

    const [clientsResult, deliveriesResult] = await Promise.all([
      supabase
        .from("clients")
        .select("id, name, phone, address, bottles_per_day, status")
        .eq("status", "active")
        .order("name", { ascending: true }),
      supabase
        .from("deliveries")
        .select("*")
        .eq("delivery_date", selectedDate),
    ]);

    if (clientsResult.error) {
      setError(clientsResult.error.message);
      setClients([]);
    } else {
      setClients((clientsResult.data ?? []) as Client[]);
    }

    if (deliveriesResult.error) {
      setError((current) => current || deliveriesResult.error.message);
      setDeliveries([]);
    } else {
      setDeliveries((deliveriesResult.data ?? []) as Delivery[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    void loadData(date);
    // Load data when the page first opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function changeDate(nextDate: string) {
    setDate(nextDate);
    setSuccess("");
    setDrafts({});
    await loadData(nextDate);
  }

  const rows = useMemo<DeliveryRow[]>(() => {
    const query = search.trim().toLowerCase();
    return clients
      .filter((client) =>
        [client.name, client.phone ?? "", client.address ?? ""].some((value) =>
          value.toLowerCase().includes(query),
        ),
      )
      .map((client) => {
        const delivery =
          deliveries.find((item) => item.client_id === client.id) ?? null;
        const draft = drafts[client.id];
        return {
          client,
          delivery,
          bottles:
            draft?.bottles ??
            String(delivery?.bottles_delivered ?? client.bottles_per_day),
          notes: draft?.notes ?? delivery?.notes ?? "",
        };
      });
  }, [clients, deliveries, search, drafts]);

  const deliveredCount = clients.filter(
    (client) =>
      deliveries.find((item) => item.client_id === client.id)?.status ===
      "delivered",
  ).length;
  const missedCount = clients.filter(
    (client) =>
      deliveries.find((item) => item.client_id === client.id)?.status ===
      "missed",
  ).length;
  const pendingCount = Math.max(0, clients.length - deliveredCount - missedCount);
  const bottleTotal = deliveries
    .filter((item) => item.status === "delivered")
    .reduce((total, item) => total + Number(item.bottles_delivered || 0), 0);

  async function saveDelivery(client: Client, status: Delivery["status"]) {
    const draft = drafts[client.id];
    const existing = deliveries.find((item) => item.client_id === client.id);
    const bottles = Number(
      draft?.bottles ??
        String(existing?.bottles_delivered ?? client.bottles_per_day),
    );
    const notes = (draft?.notes ?? existing?.notes ?? "").trim();

    if (!Number.isInteger(bottles) || bottles < 0) {
      setError("Bottles ki quantity zero ya positive whole number honi chahiye.");
      return;
    }

    setSavingId(client.id);
    setError("");
    setSuccess("");

    const payload = {
      client_id: client.id,
      delivery_date: date,
      bottles_delivered: status === "delivered" ? bottles : 0,
      status,
      notes: notes || null,
    };

    const result = existing
      ? await supabase
          .from("deliveries")
          .update(payload)
          .eq("id", existing.id)
          .select()
          .single()
      : await supabase.from("deliveries").insert(payload).select().single();

    if (result.error) {
      setError(result.error.message);
    } else {
      setSuccess(`${client.name} ki delivery ${status} mark ho gayi.`);
      setDrafts((current) => {
        const next = { ...current };
        delete next[client.id];
        return next;
      });
      await loadData(date);
    }

    setSavingId(null);
  }

  return (
    <main className="min-h-screen bg-slate-50 p-5 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-cyan-700">1Sip Management</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">Daily Deliveries</h1>
            <p className="mt-2 text-sm text-slate-500">
              Rozana ki water deliveries aur bottle records manage karo.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href="/clients"
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Clients
            </a>
            <a
              href="/dashboard"
              className="rounded-xl bg-cyan-700 px-4 py-3 text-sm font-semibold text-white hover:bg-cyan-800"
            >
              Dashboard
            </a>
          </div>
        </header>

        <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Active Clients" value={clients.length} icon={<Truck size={21} />} />
          <StatCard title="Delivered" value={deliveredCount} icon={<CheckCircle2 size={21} />} />
          <StatCard title="Pending" value={pendingCount} icon={<Clock3 size={21} />} />
          <StatCard title="Missed" value={missedCount} icon={<CircleAlert size={21} />} />
        </section>

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="grid gap-4 md:grid-cols-[240px_1fr] md:items-end">
            <div>
              <label htmlFor="delivery-date" className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <CalendarDays size={17} /> Delivery Date
              </label>
              <input
                id="delivery-date"
                type="date"
                value={date}
                max={localDateString()}
                onChange={(event) => void changeDate(event.target.value)}
                className={inputClass}
              />
            </div>
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search client name, phone, address..."
                aria-label="Search deliveries"
                className={`${inputClass} pl-10`}
              />
            </div>
          </div>
          <p className="mt-3 text-sm text-slate-500">
            Delivered bottles total: <span className="font-semibold text-slate-800">{bottleTotal}</span>
          </p>
        </section>

        {error && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        {success && <div role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{success}</div>}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 p-5">
            <h2 className="text-xl font-bold text-slate-900">Client Delivery List</h2>
            <p className="mt-1 text-sm text-slate-500">
              Har active client ke liye status save karo. Agar abhi record nahi bana, status pending samjha jayega.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 p-12 text-slate-500">
              <LoaderCircle size={20} className="animate-spin" /> Loading deliveries...
            </div>
          ) : rows.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              {clients.length === 0
                ? "Koi active client nahi mila. Pehle Clients page par client add ya activate karo."
                : "Search se koi client nahi mila."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-4 font-semibold">Client</th>
                    <th className="px-4 py-4 font-semibold">Expected</th>
                    <th className="px-4 py-4 font-semibold">Bottles Delivered</th>
                    <th className="px-4 py-4 font-semibold">Status</th>
                    <th className="px-4 py-4 font-semibold">Notes</th>
                    <th className="px-4 py-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map(({ client, delivery, bottles, notes }) => (
                    <tr key={client.id} className="align-top hover:bg-slate-50">
                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-900">{client.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{client.phone || "No phone"}</p>
                        <p className="mt-1 max-w-xs truncate text-xs text-slate-500">{client.address || "No address"}</p>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{client.bottles_per_day} bottles</td>
                      <td className="px-4 py-4">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={bottles}
                          aria-label={`${client.name} bottles delivered`}
                          onChange={(event) =>
                            setDrafts((current) => ({
                              ...current,
                              [client.id]: { bottles: event.target.value, notes },
                            }))
                          }
                          className={`${inputClass} max-w-28`}
                        />
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={delivery?.status ?? "pending"} />
                      </td>
                      <td className="px-4 py-4">
                        <input
                          value={notes}
                          aria-label={`${client.name} delivery notes`}
                          onChange={(event) =>
                            setDrafts((current) => ({
                              ...current,
                              [client.id]: { bottles, notes: event.target.value },
                            }))
                          }
                          placeholder="Optional note"
                          className={`${inputClass} min-w-40`}
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={savingId === client.id}
                            onClick={() => void saveDelivery(client, "delivered")}
                            className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            {savingId === client.id ? "Saving..." : "Delivered"}
                          </button>
                          <button
                            type="button"
                            disabled={savingId === client.id}
                            onClick={() => void saveDelivery(client, "missed")}
                            className="rounded-lg bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-200 disabled:opacity-50"
                          >
                            Missed
                          </button>
                          <button
                            type="button"
                            disabled={savingId === client.id}
                            onClick={() => void saveDelivery(client, "pending")}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                          >
                            Pending
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
            Showing {rows.length} clients for {date}
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-cyan-50 p-3 text-cyan-700">{icon}</div>
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Delivery["status"] }) {
  const classes = {
    pending: "bg-slate-100 text-slate-700",
    delivered: "bg-emerald-50 text-emerald-700",
    missed: "bg-amber-50 text-amber-800",
  };

  return (
    <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${classes[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
