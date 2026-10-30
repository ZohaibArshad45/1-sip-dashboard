import {
  Users,
  Truck,
  Wallet,
  TrendingUp,
  Clock,
  Droplets,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Search,
  Bell,
  LayoutDashboard,
  CreditCard,
  Receipt,
  Settings,
  CircleDollarSign,
} from "lucide-react";

const stats = [
  {
    title: "Total Clients",
    value: "150",
    change: "+12.5%",
    description: "from last month",
    icon: Users,
    positive: true,
  },
  {
    title: "Today's Deliveries",
    value: "120",
    change: "+8.2%",
    description: "from yesterday",
    icon: Truck,
    positive: true,
  },
  {
    title: "Pending Payments",
    value: "Rs. 35,000",
    change: "12 clients",
    description: "need to pay",
    icon: Wallet,
    positive: false,
  },
  {
    title: "Monthly Revenue",
    value: "Rs. 250,000",
    change: "+18.4%",
    description: "from last month",
    icon: TrendingUp,
    positive: true,
  },
];

const deliveries = [
  {
    name: "Ali Ahmed",
    address: "Model Town, Lahore",
    bottles: 2,
    time: "09:15 AM",
    status: "Delivered",
  },
  {
    name: "Usman Khan",
    address: "Johar Town, Lahore",
    bottles: 3,
    time: "10:30 AM",
    status: "Pending",
  },
  {
    name: "Ahmad Raza",
    address: "DHA Phase 5, Lahore",
    bottles: 1,
    time: "11:00 AM",
    status: "Delivered",
  },
  {
    name: "Hassan Ali",
    address: "Garden Town, Lahore",
    bottles: 4,
    time: "12:15 PM",
    status: "Not Delivered",
  },
];

const transactions = [
  {
    name: "Ali Ahmed",
    date: "Today, 10:25 AM",
    amount: "Rs. 3,000",
    method: "Cash",
  },
  {
    name: "Usman Khan",
    date: "Today, 11:40 AM",
    amount: "Rs. 5,000",
    method: "Bank Transfer",
  },
  {
    name: "Ahmad Raza",
    date: "Yesterday",
    amount: "Rs. 2,500",
    method: "Cash",
  },
];

const navigation = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Clients", icon: Users, active: false },
  { label: "Deliveries", icon: Truck, active: false },
  { label: "Payments", icon: CreditCard, active: false },
  { label: "Invoices", icon: Receipt, active: false },
  { label: "Expenses", icon: CircleDollarSign, active: false },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col bg-emerald-950 text-white lg:flex">
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
                  href="#"
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                    item.active
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-950/20"
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
              Keep your clients, deliveries and payments organized.
            </p>
          </div>

          <p className="mt-5 text-center text-xs text-emerald-100/50">
            © 2026 1Sip Water
          </p>
        </div>
      </aside>

      <main className="min-h-screen lg:ml-64">
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-5 backdrop-blur sm:px-8">
          <div>
            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
              Dashboard
            </h2>
            <p className="mt-1 hidden text-sm text-slate-500 sm:block">
              Here&apos;s what&apos;s happening with your business today.
            </p>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            <button
              aria-label="Search"
              className="hidden rounded-xl border border-slate-200 p-2.5 text-slate-500 hover:bg-slate-50 sm:block"
            >
              <Search size={20} />
            </button>

            <button
              aria-label="Notifications"
              className="relative rounded-xl border border-slate-200 p-2.5 text-slate-500 hover:bg-slate-50"
            >
              <Bell size={20} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
            </button>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-800">
              Z
            </div>
          </div>
        </header>

        <div className="space-y-8 p-5 sm:p-8">
          <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-medium text-emerald-700">
                Friday, October 30, 2026
              </p>
              <h3 className="mt-2 text-2xl font-bold text-slate-900">
                Welcome back, Zohaib! 👋
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Here&apos;s your water delivery business overview.
              </p>
            </div>

            <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700">
              <Plus size={19} />
              Add New Client
            </button>
          </section>

          <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <div
                  key={stat.title}
                  className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                      <Icon size={23} />
                    </div>

                    {stat.positive ? (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        <ArrowUpRight size={14} />
                        {stat.change}
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                        {stat.change}
                      </span>
                    )}
                  </div>

                  <p className="mt-5 text-sm font-medium text-slate-500">
                    {stat.title}
                  </p>

                  <h4 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
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
                  <h3 className="font-bold text-slate-900">
                    Today&apos;s Deliveries
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Track your daily water deliveries.
                  </p>
                </div>

                <button className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">
                  View All
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-5 py-4 font-semibold">Client</th>
                      <th className="px-5 py-4 font-semibold">Bottles</th>
                      <th className="px-5 py-4 font-semibold">Time</th>
                      <th className="px-5 py-4 font-semibold">Status</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {deliveries.map((delivery) => (
                      <tr
                        key={delivery.name}
                        className="transition hover:bg-slate-50/80"
                      >
                        <td className="whitespace-nowrap px-5 py-4">
                          <p className="font-semibold text-slate-800">
                            {delivery.name}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {delivery.address}
                          </p>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 font-medium">
                          {delivery.bottles}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                          {delivery.time}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4">
                          <span
                            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                              delivery.status === "Delivered"
                                ? "bg-emerald-50 text-emerald-700"
                                : delivery.status === "Pending"
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-red-50 text-red-700"
                            }`}
                          >
                            {delivery.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-slate-100 p-4 text-center">
                <button className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">
                  Manage Deliveries
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white">
              <div className="flex items-center justify-between border-b border-slate-100 p-5">
                <div>
                  <h3 className="font-bold text-slate-900">
                    Recent Payments
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Latest client transactions.
                  </p>
                </div>

                <Wallet className="text-emerald-600" size={22} />
              </div>

              <div className="divide-y divide-slate-100 px-5">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.name}
                    className="flex items-center justify-between gap-3 py-5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                        <Wallet size={18} />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {transaction.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {transaction.date}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold text-emerald-700">
                        {transaction.amount}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {transaction.method}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-100 p-4 text-center">
                <button className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">
                  View All Payments
                </button>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="flex items-center justify-between gap-4 rounded-2xl bg-emerald-950 p-6 text-white">
              <div>
                <p className="text-sm text-emerald-200">
                  Monthly Business Expenses
                </p>
                <h3 className="mt-3 text-3xl font-bold">Rs. 100,000</h3>
                <p className="mt-2 text-sm text-emerald-200/80">
                  Example monthly expenses
                </p>
              </div>

              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                <ArrowDownRight size={28} />
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-2xl bg-emerald-600 p-6 text-white">
              <div>
                <p className="text-sm text-emerald-50">
                  Estimated Monthly Profit
                </p>
                <h3 className="mt-3 text-3xl font-bold">Rs. 150,000</h3>
                <p className="mt-2 text-sm text-emerald-50/80">
                  Example profit before final reconciliation
                </p>
              </div>

              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                <TrendingUp size={28} />
              </div>
            </div>
          </section>

          <footer className="pb-3 text-center text-xs text-slate-400">
            1Sip Water Management Dashboard
          </footer>
        </div>
      </main>
    </div>
  );
}