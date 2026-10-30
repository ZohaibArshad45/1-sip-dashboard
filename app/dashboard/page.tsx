import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Users,
  Truck,
  Wallet,
  TrendingUp,
  Plus,
  Droplets,
  LayoutDashboard,
  CreditCard,
  Receipt,
  Settings,
  CircleDollarSign,
  Clock,
  MapPin,
  CalendarDays,
  ChevronRight,
  LogOut,
} from "lucide-react";

type Client = {
  id: string;
  name: string;
  address: string | null;
  monthly_price: number | string;
  bottles_per_day: number;
  status: "active" | "inactive";
  created_at: string;
};

function formatDate() {
  return new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Karachi",
  }).format(new Date());
}

function formatCurrency(value: number) {
  return `Rs. ${value.toLocaleString("en-PK", {
    maximumFractionDigits: 2,
  })}`;
}

async function logout() {
  "use server";

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: clientRows, error: clientsError } = await supabase
    .from("clients")
    .select("id, name, address, monthly_price, bottles_per_day, status, created_at")
    .order("created_at", { ascending: false });

  const clients = (clientRows ?? []) as Client[];
  const activeClients = clients.filter((client) => client.status === "active");
  const monthlyRevenue = activeClients.reduce(
    (total, client) => total + Number(client.monthly_price || 0),
    0
  );
  const totalDailyBottles = activeClients.reduce(
    (total, client) => total + Number(client.bottles_per_day || 0),
    0
  );

  const navigation = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, active: true },
    { label: "Clients", href: "/clients", icon: Users, active: false },
    { label: "Deliveries", href: "/deliveries", icon: Truck, active: false },
    { label: "Payments", href: "/payments", icon: CreditCard, active: false },
    { label: "Invoices", href: "/invoices", icon: Receipt, active: false },
    { label: "Expenses", href: "/expenses", icon: CircleDollarSign, active: false },
  ];

  const stats = [
    {
      title: "Total Clients",
      value: clients.length.toLocaleString("en-PK"),
      description: `${activeClients.length} active clients`,
      icon: Users,
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "Daily Bottles",
      value: totalDailyBottles.toLocaleString("en-PK"),
      description: "Planned from active clients",
      icon: Truck,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "Pending Payments",
      value: "Not tracked yet",
      description: "Payment records are not set up",
      icon: Wallet,
      color: "bg-amber-50 text-amber-600",
    },
    {
      title: "Monthly Revenue",
      value: formatCurrency(monthlyRevenue),
      description: "Total monthly price of active clients",
      icon: TrendingUp,
      color: "bg-purple-50 text-purple-600",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-emerald-950 text-white lg:flex">
        <div className="flex h-20 items-center gap-3 border-b border-white/10 px-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500">
            <Droplets size={27} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-wide">1Sip</h1>
            <p className="text-xs text-emerald-200">Water Management</p>
          </div>
        </div>

        <div className="px-4 py-7">
          <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-widest text-emerald-300">
            Main Menu
          </p>
          <nav className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                    item.active
                      ? "bg-emerald-500 text-white shadow-lg"
                      : "text-emerald-100/75 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon size={20} />
                  {item.label}
                </a>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
              <Settings size={20} />
            </div>
            <h3 className="font-semibold">Manage your business</h3>
            <p className="mt-1 text-xs leading-5 text-emerald-100/70">
              Manage your real client records and track your business as more features are connected.
            </p>
          </div>
          <p className="mt-5 text-center text-xs text-emerald-100/50">
            © 2026 1Sip Water
          </p>
        </div>
      </aside>

      <main className="min-h-screen lg:ml-64">
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-5 backdrop-blur sm:px-8">
          <div>
            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
              Dashboard
            </h2>
            <p className="mt-1 hidden text-sm text-slate-500 sm:block">
              Your business overview, based on saved records.
            </p>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-800">
                {user.email ?? "Signed in"}
              </p>
              <p className="text-xs text-slate-500">1Sip account</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-800">
              {(user.email?.[0] ?? "U").toUpperCase()}
            </div>
            <form action={logout}>
              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </form>
          </div>
        </header>

        <div className="space-y-8 p-5 sm:p-8">
          <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                <CalendarDays size={16} />
                {formatDate()}
              </p>
              <h3 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
                Welcome back!
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Live figures from your 1Sip client records.
              </p>
            </div>
            <a
              href="/clients"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
            >
              <Plus size={19} />
              Add New Client
            </a>
          </section>

          {clientsError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Could not load client records: {clientsError.message}
            </div>
          )}

          <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.title}
                  className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50">
                    <span className={stat.color}>
                      <Icon size={23} />
                    </span>
                  </div>
                  <p className="mt-5 text-sm font-medium text-slate-500">
                    {stat.title}
                  </p>
                  <h4 className="mt-2 break-words text-2xl font-bold tracking-tight text-slate-900">
                    {stat.value}
                  </h4>
                  <p className="mt-2 text-xs text-slate-400">
                    {stat.description}
                  </p>
                </div>
              );
            })}
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white xl:col-span-2">
              <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
                <div>
                  <h3 className="font-bold text-slate-900">Recent Clients</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Latest clients saved in Supabase.
                  </p>
                </div>
                <a
                  href="/clients"
                  className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  View All
                </a>
              </div>

              {clients.length === 0 ? (
                <div className="p-10 text-center">
                  <Users size={32} className="mx-auto mb-3 text-slate-300" />
                  <p className="font-semibold text-slate-700">No clients yet</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Add a client to see real records here.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-5 py-4 font-semibold">Client</th>
                        <th className="px-5 py-4 font-semibold">Bottles per day</th>
                        <th className="px-5 py-4 font-semibold">Monthly price</th>
                        <th className="px-5 py-4 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {clients.slice(0, 5).map((client) => (
                        <tr key={client.id} className="transition hover:bg-slate-50">
                          <td className="whitespace-nowrap px-5 py-4">
                            <p className="font-semibold text-slate-800">{client.name}</p>
                            <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                              <MapPin size={12} />
                              {client.address || "No address added"}
                            </p>
                          </td>
                          <td className="whitespace-nowrap px-5 py-4 font-medium">
                            {client.bottles_per_day}
                          </td>
                          <td className="whitespace-nowrap px-5 py-4 font-medium">
                            {formatCurrency(Number(client.monthly_price || 0))}
                          </td>
                          <td className="whitespace-nowrap px-5 py-4">
                            <span
                              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                                client.status === "active"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {client.status === "active" ? "Active" : "Inactive"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="border-t border-slate-100 p-4 text-center">
                <a
                  href="/clients"
                  className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  Manage Clients
                </a>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white">
              <div className="flex items-center justify-between border-b border-slate-100 p-5">
                <div>
                  <h3 className="font-bold text-slate-900">Recent Payments</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Payment history will appear here after payments are connected.
                  </p>
                </div>
                <Wallet className="text-emerald-600" size={22} />
              </div>
              <div className="p-8 text-center">
                <CreditCard size={30} className="mx-auto mb-3 text-slate-300" />
                <p className="font-semibold text-slate-700">No payment records yet</p>
                <p className="mt-1 text-sm text-slate-500">
                  No sample transactions are shown.
                </p>
                <a
                  href="/payments"
                  className="mt-4 inline-flex text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  Open Payments
                </a>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="flex items-center justify-between gap-4 rounded-2xl bg-emerald-950 p-6 text-white">
              <div>
                <p className="text-sm text-emerald-200">Monthly Business Expenses</p>
                <h3 className="mt-3 text-2xl font-bold">Not available yet</h3>
                <p className="mt-2 text-sm text-emerald-200/80">
                  Expense records have not been connected.
                </p>
              </div>
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                <CircleDollarSign size={28} />
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-2xl bg-emerald-600 p-6 text-white">
              <div>
                <p className="text-sm text-emerald-50">Monthly Profit</p>
                <h3 className="mt-3 text-2xl font-bold">Not available yet</h3>
                <p className="mt-2 text-sm text-emerald-50/80">
                  Profit will be calculated when payments and expenses are connected.
                </p>
              </div>
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                <TrendingUp size={28} />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h3 className="font-bold text-slate-900">Quick Actions</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Shortcuts for managing your business.
                </p>
              </div>
              <ChevronRight size={20} className="hidden text-slate-400 sm:block" />
            </div>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { href: "/clients", label: "Manage Clients", description: "View and update clients", icon: Users, color: "bg-emerald-50 text-emerald-700" },
                { href: "/deliveries", label: "Deliveries", description: "Delivery tracking setup", icon: Truck, color: "bg-blue-50 text-blue-700" },
                { href: "/payments", label: "Payments", description: "Payment tracking setup", icon: CreditCard, color: "bg-amber-50 text-amber-700" },
                { href: "/expenses", label: "Expenses", description: "Expense tracking setup", icon: CircleDollarSign, color: "bg-purple-50 text-purple-700" },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <a
                    key={action.href}
                    href={action.href}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-emerald-300 hover:bg-emerald-50/50"
                  >
                    <div className={`rounded-lg p-2.5 ${action.color}`}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{action.label}</p>
                      <p className="mt-1 text-xs text-slate-500">{action.description}</p>
                    </div>
                    <Plus size={16} className="ml-auto text-slate-400" />
                  </a>
                );
              })}
            </div>
          </section>

          <footer className="flex flex-col items-center justify-between gap-2 pb-3 text-xs text-slate-400 sm:flex-row">
            <p>© 2026 1Sip Water Management</p>
            <p className="flex items-center gap-2">
              <Clock size={13} />
              Pakistan Standard Time
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}
