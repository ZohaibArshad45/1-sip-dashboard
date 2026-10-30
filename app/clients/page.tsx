"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  UserPlus,
  Users,
  LoaderCircle,
  Search,
  Pencil,
  Trash2,
  X,
  Save,
  RotateCcw,
} from "lucide-react";

type Client = {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  monthly_price: number;
  bottles_per_day: number;
  status: "active" | "inactive";
  created_at: string;
};

type ClientForm = {
  name: string;
  phone: string;
  address: string;
  monthly_price: string;
  bottles_per_day: string;
};

const emptyForm: ClientForm = {
  name: "",
  phone: "",
  address: "",
  monthly_price: "",
  bottles_per_day: "1",
};

const inputClass =
  "w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100";

export default function ClientsPage() {
  const supabase = createClient();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyClientId, setBusyClientId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [form, setForm] = useState<ClientForm>(emptyForm);

  async function loadClients() {
    setLoading(true);
    setError("");

    const { data, error: loadError } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });

    if (loadError) {
      setError(loadError.message);
    } else {
      setClients((data ?? []) as Client[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    void loadClients();
    // Load clients once when this page opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingClient(null);
  }

  function startEditing(client: Client) {
    setEditingClient(client);
    setForm({
      name: client.name,
      phone: client.phone ?? "",
      address: client.address ?? "",
      monthly_price: String(client.monthly_price ?? 0),
      bottles_per_day: String(client.bottles_per_day ?? 1),
    });
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
      monthly_price: Number(form.monthly_price),
      bottles_per_day: Number(form.bottles_per_day),
    };

    if (!payload.name || !Number.isFinite(payload.monthly_price) || payload.monthly_price < 0 || !Number.isInteger(payload.bottles_per_day) || payload.bottles_per_day < 1) {
      setError("Name, valid monthly price aur kam az kam 1 bottle per day enter karo.");
      setSaving(false);
      return;
    }

    if (editingClient) {
      const { error: updateError } = await supabase
        .from("clients")
        .update(payload)
        .eq("id", editingClient.id);

      if (updateError) {
        setError(updateError.message);
      } else {
        setSuccess("Client details update ho gayi hain.");
        resetForm();
        await loadClients();
      }
    } else {
      const { error: insertError } = await supabase.from("clients").insert(payload);

      if (insertError) {
        setError(insertError.message);
      } else {
        setSuccess("Client successfully add ho gaya!");
        resetForm();
        await loadClients();
      }
    }

    setSaving(false);
  }

  async function toggleStatus(client: Client) {
    setError("");
    setSuccess("");
    setBusyClientId(client.id);

    const newStatus = client.status === "active" ? "inactive" : "active";
    const { error: updateError } = await supabase
      .from("clients")
      .update({ status: newStatus })
      .eq("id", client.id);

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(`${client.name} ka status update ho gaya.`);
      await loadClients();
    }

    setBusyClientId(null);
  }

  async function deleteClient(client: Client) {
    const confirmed = window.confirm(
      `Kya aap ${client.name} ko delete karna chahte hain? Ye action undo nahi ho sakta.`
    );
    if (!confirmed) return;

    setError("");
    setSuccess("");
    setBusyClientId(client.id);

    const { error: deleteError } = await supabase
      .from("clients")
      .delete()
      .eq("id", client.id);

    if (deleteError) {
      setError(deleteError.message);
    } else {
      setSuccess("Client delete ho gaya.");
      if (editingClient?.id === client.id) resetForm();
      await loadClients();
    }

    setBusyClientId(null);
  }

  const filteredClients = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return clients;
    return clients.filter((client) =>
      [client.name, client.phone ?? "", client.address ?? ""]
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [clients, search]);

  const activeCount = clients.filter((client) => client.status === "active").length;

  return (
    <main className="min-h-screen bg-slate-50 p-5 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-cyan-700">1Sip Management</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">Clients</h1>
            <p className="mt-2 text-sm text-slate-500">Apne water delivery clients manage karo.</p>
          </div>
          <a href="/dashboard" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100">
            Dashboard
          </a>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-cyan-50 p-3 text-cyan-700"><Users size={22} /></div>
              <div><p className="text-sm text-slate-500">Total Clients</p><p className="text-2xl font-bold text-slate-900">{clients.length}</p></div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700"><Users size={22} /></div>
              <div><p className="text-sm text-slate-500">Active Clients</p><p className="text-2xl font-bold text-slate-900">{activeCount}</p></div>
            </div>
          </div>
        </div>

        {error && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        {success && <div role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{success}</div>}

        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-cyan-50 p-3 text-cyan-700">{editingClient ? <Pencil size={22} /> : <UserPlus size={22} />}</div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{editingClient ? "Edit Client" : "Add New Client"}</h2>
                <p className="text-sm text-slate-500">{editingClient ? "Client ki details update karo." : "Client ki details enter karo."}</p>
              </div>
            </div>
            {editingClient && <button type="button" onClick={resetForm} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"><X size={16} /> Cancel</button>}
          </div>

          <form onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
            <div><label className="mb-2 block text-sm font-medium text-slate-700">Client Name *</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Client ka naam" className={inputClass} /></div>
            <div><label className="mb-2 block text-sm font-medium text-slate-700">Phone Number</label><input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="03XXXXXXXXX" className={inputClass} /></div>
            <div><label className="mb-2 block text-sm font-medium text-slate-700">Monthly Price (Rs.) *</label><input required min="0" type="number" step="0.01" value={form.monthly_price} onChange={(e) => setForm({ ...form, monthly_price: e.target.value })} placeholder="3000" className={inputClass} /></div>
            <div><label className="mb-2 block text-sm font-medium text-slate-700">Bottles Per Day *</label><input required min="1" type="number" step="1" value={form.bottles_per_day} onChange={(e) => setForm({ ...form, bottles_per_day: e.target.value })} className={inputClass} /></div>
            <div className="sm:col-span-2"><label className="mb-2 block text-sm font-medium text-slate-700">Address</label><textarea rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Client ka complete address" className={inputClass} /></div>
            <div className="flex flex-wrap gap-3 sm:col-span-2">
              <button type="submit" disabled={saving} className="flex items-center justify-center gap-2 rounded-xl bg-cyan-700 px-6 py-3 font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60">
                {saving ? <><LoaderCircle size={18} className="animate-spin" /> Saving...</> : editingClient ? <><Save size={18} /> Save Changes</> : <><UserPlus size={18} /> Add Client</>}
              </button>
              {editingClient && <button type="button" onClick={resetForm} className="flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"><RotateCcw size={17} /> Reset</button>}
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
            <div><h2 className="text-xl font-bold text-slate-900">All Clients</h2><p className="mt-1 text-sm text-slate-500">Search, edit aur client status manage karo.</p></div>
            <div className="relative w-full sm:max-w-sm"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, phone, address..." aria-label="Search clients" className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100" /></div>
          </div>

          {loading ? <div className="flex items-center justify-center gap-2 p-12 text-slate-500"><LoaderCircle size={20} className="animate-spin" /> Loading clients...</div> : filteredClients.length === 0 ? <div className="p-12 text-center"><Users size={36} className="mx-auto mb-3 text-slate-300" /><p className="font-semibold text-slate-700">{search ? "Koi matching client nahi mila." : "Abhi koi client nahi hai."}</p><p className="mt-1 text-sm text-slate-500">{search ? "Search words change karke try karo." : "Upar form se apna pehla client add karo."}</p></div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500"><tr><th className="px-5 py-4 font-semibold">Client</th><th className="px-5 py-4 font-semibold">Phone</th><th className="px-5 py-4 font-semibold">Daily Bottles</th><th className="px-5 py-4 font-semibold">Monthly Price</th><th className="px-5 py-4 font-semibold">Status</th><th className="px-5 py-4 font-semibold">Actions</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredClients.map((client) => <tr key={client.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4"><p className="font-semibold text-slate-900">{client.name}</p><p className="mt-1 max-w-xs truncate text-xs text-slate-500">{client.address || "No address"}</p></td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">{client.phone || "Not provided"}</td>
                    <td className="px-5 py-4 text-slate-600">{client.bottles_per_day}</td>
                    <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-900">Rs. {Number(client.monthly_price).toLocaleString("en-PK")}</td>
                    <td className="px-5 py-4"><button type="button" disabled={busyClientId === client.id} onClick={() => void toggleStatus(client)} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold disabled:opacity-50 ${client.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{busyClientId === client.id ? "Updating..." : client.status === "active" ? "Active" : "Inactive"}</button></td>
                    <td className="px-5 py-4"><div className="flex items-center gap-2"><button type="button" onClick={() => startEditing(client)} title="Edit client" aria-label={`Edit ${client.name}`} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"><Pencil size={16} /></button><button type="button" disabled={busyClientId === client.id} onClick={() => void deleteClient(client)} title="Delete client" aria-label={`Delete ${client.name}`} className="rounded-lg border border-red-100 p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"><Trash2 size={16} /></button></div></td>
                  </tr>)}
                </tbody>
              </table>
            </div>
          )}
          <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">Showing {filteredClients.length} of {clients.length} clients</div>
        </section>
      </div>
    </main>
  );
}
