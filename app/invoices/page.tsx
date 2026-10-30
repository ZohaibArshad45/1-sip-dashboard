"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  FileText,
  LoaderCircle,
  Search,
  Download,
  Printer,
  MessageCircle,
  CalendarDays,
  ReceiptText,
  CircleDollarSign,
} from "lucide-react";

type Client = {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  monthly_price: number;
  status: "active" | "inactive";
};

type Payment = {
  id: string;
  client_id: string;
  amount: number;
  billing_month: string;
  payment_date: string;
  payment_method: string;
  notes: string | null;
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

function dateLabel(value: string) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value.slice(0, 10)}T00:00:00Z`));
}

function monthLabel(value: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-PK", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value.slice(0, 7)}-01T00:00:00Z`));
}

export default function InvoicesPage() {
  const supabase = createClient();
  const [clients, setClients] = useState<Client[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(monthStart(localDateString()));
  const [selectedClientId, setSelectedClientId] = useState("all");

  async function loadData() {
    setLoading(true);
    setError("");

    const [clientResult, paymentResult] = await Promise.all([
      supabase
        .from("clients")
        .select("id, name, phone, address, monthly_price, status")
        .order("name", { ascending: true }),
      supabase
        .from("payments")
        .select("id, client_id, amount, billing_month, payment_date, payment_method, notes")
        .order("payment_date", { ascending: false }),
    ]);

    if (clientResult.error) setError(clientResult.error.message);
    else setClients((clientResult.data ?? []) as Client[]);

    if (paymentResult.error) {
      setError((current) =>
        current ? `${current} | ${paymentResult.error?.message ?? ""}` : paymentResult.error?.message ?? ""
      );
    } else {
      setPayments((paymentResult.data ?? []) as Payment[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    void loadData();
    // Load invoices from Supabase when this page opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const invoices = useMemo(() => {
    const monthPayments = payments.filter((payment) => payment.billing_month === selectedMonth);
    const activeClients = clients.filter((client) => client.status === "active");

    return activeClients.map((client) => {
      const clientPayments = monthPayments.filter((payment) => payment.client_id === client.id);
      const paid = clientPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
      const charge = Number(client.monthly_price || 0);
      const balance = Math.max(charge - paid, 0);
      const overpaid = Math.max(paid - charge, 0);

      return {
        client,
        clientPayments,
        charge,
        paid,
        balance,
        overpaid,
        status: paid >= charge ? "Paid" : paid > 0 ? "Partially Paid" : "Unpaid",
      };
    });
  }, [clients, payments, selectedMonth]);

  const visibleInvoices = invoices.filter((invoice) => {
    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      [invoice.client.name, invoice.client.phone ?? "", invoice.client.address ?? ""].some((value) =>
        value.toLowerCase().includes(query)
      );
    const matchesClient = selectedClientId === "all" || invoice.client.id === selectedClientId;
    return matchesSearch && matchesClient;
  });

  const totals = invoices.reduce(
    (result, invoice) => ({
      charges: result.charges + invoice.charge,
      paid: result.paid + invoice.paid,
      balance: result.balance + invoice.balance,
    }),
    { charges: 0, paid: 0, balance: 0 }
  );

  function createInvoiceHtml(invoice: (typeof invoices)[number]) {
    const monthPayments = invoice.clientPayments
      .map(
        (payment) => `
          <tr>
            <td>${dateLabel(payment.payment_date)}</td>
            <td>${escapeHtml(payment.payment_method)}</td>
            <td class="amount">${money(Number(payment.amount))}</td>
            <td>${escapeHtml(payment.notes || "No notes")}</td>
          </tr>`
      )
      .join("");

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>1Sip Invoice ${escapeHtml(invoice.client.name)} ${escapeHtml(monthLabel(selectedMonth))}</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; padding: 32px; color: #172033; background: #eef6f9; font-family: Arial, Helvetica, sans-serif; }
  .sheet { max-width: 820px; margin: 0 auto; background: white; border-radius: 18px; overflow: hidden; box-shadow: 0 10px 35px rgba(15, 75, 95, .12); }
  .top { padding: 34px 40px; color: white; background: linear-gradient(120deg, #0e7490, #0891b2); display: flex; justify-content: space-between; gap: 24px; }
  .brand { font-size: 30px; font-weight: 800; letter-spacing: -.5px; }
  .tag { margin-top: 7px; color: #cffafe; font-size: 12px; }
  .invoice-title { text-align: right; }
  .invoice-title h1 { margin: 0; font-size: 27px; }
  .invoice-title p { margin: 8px 0 0; color: #cffafe; }
  .body { padding: 34px 40px 40px; }
  .details { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 30px; }
  .label { color: #64748b; text-transform: uppercase; font-size: 10px; font-weight: bold; letter-spacing: 1px; margin-bottom: 8px; }
  .name { font-size: 18px; font-weight: 700; margin-bottom: 6px; }
  .muted { color: #64748b; font-size: 13px; line-height: 1.6; }
  .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 26px 0; }
  .box { background: #f0f9ff; border: 1px solid #dbeafe; border-radius: 12px; padding: 16px; }
  .box span { display: block; color: #64748b; font-size: 11px; margin-bottom: 8px; }
  .box strong { color: #0e7490; font-size: 19px; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  th { background: #ecfeff; color: #155e75; text-align: left; font-size: 11px; padding: 12px 10px; }
  td { padding: 12px 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
  .amount { text-align: right; white-space: nowrap; }
  .status { display: inline-block; border-radius: 30px; padding: 6px 11px; font-size: 11px; font-weight: bold; background: ${invoice.balance === 0 ? "#dcfce7" : invoice.paid > 0 ? "#fef3c7" : "#fee2e2"}; color: ${invoice.balance === 0 ? "#166534" : invoice.paid > 0 ? "#92400e" : "#991b1b"}; }
  .balance { margin-top: 22px; display: flex; justify-content: space-between; align-items: center; border-top: 2px solid #cffafe; padding-top: 18px; font-size: 15px; }
  .balance strong { font-size: 23px; color: ${invoice.balance > 0 ? "#b45309" : "#047857"}; }
  .footer { margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 18px; color: #64748b; font-size: 11px; display: flex; justify-content: space-between; gap: 16px; }
  .print { display: block; margin: 20px auto 0; padding: 12px 22px; border: 0; border-radius: 9px; color: white; background: #0e7490; font-weight: bold; cursor: pointer; }
  @media (max-width: 600px) { body { padding: 0; } .sheet { border-radius: 0; } .top, .body { padding: 24px; } .top { flex-direction: column; } .invoice-title { text-align: left; } .details { grid-template-columns: 1fr; } .summary { grid-template-columns: 1fr; } .footer { flex-direction: column; } }
  @media print { body { background: white; padding: 0; } .sheet { box-shadow: none; max-width: none; border-radius: 0; } .print { display: none; } }
</style>
</head>
<body>
<article class="sheet">
  <header class="top">
    <div><div class="brand">1Sip</div><div class="tag">Water delivery service</div></div>
    <div class="invoice-title"><h1>MONTHLY INVOICE</h1><p>${escapeHtml(monthLabel(selectedMonth))}</p></div>
  </header>
  <section class="body">
    <div class="details">
      <div><div class="label">Billed to</div><div class="name">${escapeHtml(invoice.client.name)}</div><div class="muted">${escapeHtml(invoice.client.phone || "Phone not provided")}<br/>${escapeHtml(invoice.client.address || "Address not provided")}</div></div>
      <div><div class="label">Invoice details</div><div class="muted">Billing month: <strong>${escapeHtml(monthLabel(selectedMonth))}</strong><br/>Invoice date: <strong>${dateLabel(localDateString())}</strong><br/>Payment status: <span class="status">${invoice.status}</span></div></div>
    </div>
    <div class="summary">
      <div class="box"><span>Monthly charges</span><strong>${money(invoice.charge)}</strong></div>
      <div class="box"><span>Payments received</span><strong>${money(invoice.paid)}</strong></div>
      <div class="box"><span>Balance due</span><strong>${money(invoice.balance)}</strong></div>
    </div>
    <div class="label">Payment history for this month</div>
    <table><thead><tr><th>Date</th><th>Method</th><th class="amount">Amount</th><th>Notes</th></tr></thead><tbody>${monthPayments || '<tr><td colspan="4">No payments recorded for this month.</td></tr>'}</tbody></table>
    <div class="balance"><span>Remaining balance</span><strong>${money(invoice.balance)}</strong></div>
    <div class="footer"><span>Thank you for choosing 1Sip.</span><span>Generated from 1Sip Management</span></div>
  </section>
</article>
<button class="print" onclick="window.print()">Print or Save as PDF</button>
</body>
</html>`;
  }

  function downloadInvoice(invoice: (typeof invoices)[number]) {
    const html = createInvoiceHtml(invoice);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `1Sip_Invoice_${invoice.client.name.replace(/[^a-z0-9]+/gi, "_")}_${selectedMonth.slice(0, 7)}.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function printInvoice(invoice: (typeof invoices)[number]) {
    const html = createInvoiceHtml(invoice);
    const printWindow = window.open("", "_blank", "width=900,height=800");
    if (!printWindow) {
      setError("Print window blocked hai. Browser mein popups allow karo.");
      return;
    }
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
  }

  function sendWhatsApp(invoice: (typeof invoices)[number]) {
    const rawPhone = invoice.client.phone ?? "";
    const phone = rawPhone.replace(/\D/g, "");
    if (!phone) {
      setError(`${invoice.client.name} ka phone number clients page par add karo.`);
      return;
    }

    const message = [
      `Assalam o Alaikum ${invoice.client.name},`,
      `Aap ki 1Sip invoice ${monthLabel(selectedMonth)} ke liye:`,
      `Monthly charges: ${money(invoice.charge)}`,
      `Payment received: ${money(invoice.paid)}`,
      `Remaining balance: ${money(invoice.balance)}`,
      `Payment status: ${invoice.status}`,
      "Shukriya, 1Sip",
    ].join("\n");

    const normalizedPhone =
      phone.startsWith("0") && phone.length === 11 ? `92${phone.slice(1)}` : phone;
    window.open(
      `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  function downloadAllInvoices() {
    const html = visibleInvoices
      .map((invoice) => createInvoiceHtml(invoice))
      .join('<div style="page-break-after:always"></div>');
    const fullHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>1Sip Monthly Invoices</title></head><body>${html}</body></html>`;
    const blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `1Sip_Invoices_${selectedMonth.slice(0, 7)}.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-slate-50 p-5 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-cyan-700">1Sip Management</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">Invoices & Receipts</h1>
            <p className="mt-2 text-sm text-slate-500">Cyan design mein monthly invoices banao, print karo aur WhatsApp par bhejo.</p>
          </div>
          <a href="/dashboard" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100">Dashboard</a>
        </div>

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Billing month</label>
              <div className="relative">
                <CalendarDays size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="month" aria-label="Billing month" value={selectedMonth.slice(0, 7)} onChange={(event) => setSelectedMonth(event.target.value ? `${event.target.value}-01` : "")} className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-slate-900 outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100" />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Client</label>
              <select value={selectedClientId} onChange={(event) => setSelectedClientId(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100">
                <option value="all">All active clients</option>
                {clients.filter((client) => client.status === "active").map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Search</label>
              <div className="relative">
                <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Client name or phone" className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-slate-900 outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100" />
              </div>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
            <p className="text-sm text-slate-500">Selected month: <strong className="text-slate-800">{monthLabel(selectedMonth)}</strong></p>
            <button type="button" onClick={downloadAllInvoices} disabled={visibleInvoices.length === 0} className="inline-flex items-center gap-2 rounded-xl bg-cyan-700 px-4 py-3 text-sm font-semibold text-white hover:bg-cyan-800 disabled:opacity-50"><Download size={17} /> Download all invoices</button>
          </div>
        </section>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryCard title="Monthly Charges" amount={money(totals.charges)} icon={<FileText size={22} />} />
          <SummaryCard title="Payments Received" amount={money(totals.paid)} icon={<ReceiptText size={22} />} />
          <SummaryCard title="Outstanding Balance" amount={money(totals.balance)} icon={<CircleDollarSign size={22} />} />
        </div>

        {error && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 p-5">
            <h2 className="text-xl font-bold text-slate-900">Monthly invoices</h2>
            <p className="mt-1 text-sm text-slate-500">Har client ke liye invoice preview, print aur WhatsApp actions.</p>
          </div>
          {loading ? (
            <div className="flex items-center justify-center gap-3 p-12 text-slate-500"><LoaderCircle size={22} className="animate-spin" /> Loading invoices...</div>
          ) : visibleInvoices.length === 0 ? (
            <div className="p-12 text-center"><FileText size={30} className="mx-auto mb-3 text-slate-400" /><h3 className="font-semibold text-slate-900">No invoices found</h3><p className="mt-1 text-sm text-slate-500">Is month mein active clients nahi hain ya search match nahi mila.</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-4 font-semibold">Client</th><th className="px-5 py-4 font-semibold">Monthly charges</th><th className="px-5 py-4 font-semibold">Paid</th><th className="px-5 py-4 font-semibold">Balance</th><th className="px-5 py-4 font-semibold">Status</th><th className="px-5 py-4 font-semibold">Actions</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleInvoices.map((invoice) => (
                    <tr key={invoice.client.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4"><p className="font-semibold text-slate-900">{invoice.client.name}</p><p className="mt-1 text-xs text-slate-500">{invoice.client.phone || "No phone number"}</p></td>
                      <td className="px-5 py-4 font-medium text-slate-700">{money(invoice.charge)}</td>
                      <td className="px-5 py-4 font-semibold text-emerald-700">{money(invoice.paid)}</td>
                      <td className="px-5 py-4 font-semibold text-amber-700">{money(invoice.balance)}</td>
                      <td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${invoice.status === "Paid" ? "bg-emerald-50 text-emerald-700" : invoice.status === "Partially Paid" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>{invoice.status}</span></td>
                      <td className="px-5 py-4"><div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => printInvoice(invoice)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"><Printer size={14} /> Print / PDF</button>
                        <button type="button" onClick={() => downloadInvoice(invoice)} className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-200 px-3 py-2 text-xs font-semibold text-cyan-800 hover:bg-cyan-50"><Download size={14} /> Download</button>
                        <button type="button" onClick={() => sendWhatsApp(invoice)} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-50"><MessageCircle size={14} /> WhatsApp</button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="mt-5 rounded-xl border border-cyan-100 bg-cyan-50 p-4 text-sm text-cyan-950">
          <strong>PDF tip:</strong> Print / PDF par click karo, phir browser print dialog mein “Save as PDF” select karo. Download button invoice ko HTML file ke taur par save karta hai, jise browser mein open karke print ya PDF save kar sakte ho. WhatsApp button message kholta hai, invoice file automatically attach nahi karta.
        </div>
      </div>
    </main>
  );
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
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
