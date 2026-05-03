import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Search, Filter, Download, MoreHorizontal } from "lucide-react";

export const Route = createFileRoute("/dashboard/customers")({
  head: () => ({ meta: [{ title: "Customers — Saadhyam AI" }] }),
  component: CustomersPage,
});

const customers = [
  {
    name: "Aanya Patel",
    email: "aanya@bloom.in",
    status: "VIP",
    orders: 24,
    spend: "₹84,200",
    last: "2 days ago",
  },
  {
    name: "Rohan Kapoor",
    email: "rohan.k@gmail.com",
    status: "Active",
    orders: 12,
    spend: "₹38,900",
    last: "5 days ago",
  },
  {
    name: "Meera Iyer",
    email: "meera.iyer@outlook.com",
    status: "VIP",
    orders: 31,
    spend: "₹1,12,400",
    last: "Yesterday",
  },
  {
    name: "Vikram Singh",
    email: "vsingh@studio.co",
    status: "Dormant",
    orders: 4,
    spend: "₹6,800",
    last: "3 months ago",
  },
  {
    name: "Sneha Reddy",
    email: "sneha.r@mail.com",
    status: "Active",
    orders: 9,
    spend: "₹22,100",
    last: "Today",
  },
  {
    name: "Karan Bose",
    email: "karan@bose.in",
    status: "New",
    orders: 1,
    spend: "₹2,400",
    last: "1 hour ago",
  },
  {
    name: "Divya Nair",
    email: "divya.n@artmail.com",
    status: "VIP",
    orders: 28,
    spend: "₹98,600",
    last: "4 days ago",
  },
];

const statusStyle: Record<string, string> = {
  VIP: "bg-gradient-primary text-primary-foreground",
  Active: "bg-success/15 text-success",
  Dormant: "bg-muted text-muted-foreground",
  New: "bg-accent/20 text-amber-700",
};

function CustomersPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Customers"
        subtitle="2,418 total · 247 added this week"
        actions={
          <>
            <Button variant="outline" size="sm">
              <Filter size={14} /> Filters
            </Button>
            <Button variant="outline" size="sm">
              <Download size={14} /> Export
            </Button>
          </>
        }
      />

      <div className="bg-card rounded-2xl border border-border/60 shadow-soft overflow-hidden">
        <div className="p-4 border-b border-border/60 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              placeholder="Search customers..."
              className="w-full h-9 pl-9 pr-3 rounded-xl bg-muted/60 text-sm outline-none focus:bg-background focus:ring-2 focus:ring-primary/15"
            />
          </div>
          <div className="hidden md:flex gap-1">
            {["All", "VIP", "Active", "Dormant", "New"].map((f) => (
              <button
                key={f}
                className="px-3 py-1.5 rounded-full text-xs font-medium hover:bg-accent/40 transition"
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground bg-muted/30">
                <th className="text-left font-medium px-4 py-3">Customer</th>
                <th className="text-left font-medium px-4 py-3">Status</th>
                <th className="text-right font-medium px-4 py-3">Orders</th>
                <th className="text-right font-medium px-4 py-3">Spend</th>
                <th className="text-left font-medium px-4 py-3">Last seen</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr
                  key={c.email}
                  className="border-t border-border/60 hover:bg-muted/30 transition"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-gradient-brand text-white flex items-center justify-center text-xs font-bold">
                        {c.name
                          .split(" ")
                          .map((p) => p[0])
                          .join("")}
                      </div>
                      <div>
                        <p className="font-medium">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusStyle[c.status]}`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{c.orders}</td>
                  <td className="px-4 py-3 text-right font-semibold">{c.spend}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.last}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="h-8 w-8 rounded-lg hover:bg-accent/40 inline-flex items-center justify-center">
                      <MoreHorizontal size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
