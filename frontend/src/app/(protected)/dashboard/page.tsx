"use client";

import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { createClient } from "@/lib/supabase/client";
import { MetricCard, PageTitle } from "@/components/shared";

type Sale = { id: string; total: number; created_at: string };
type SaleItemJoin = { quantity: number; products: { name: string } | null };

export default function DashboardPage() {
  const supabase = createClient();
  const [salesToday, setSalesToday] = useState(0);
  const [revenueToday, setRevenueToday] = useState(0);
  const [lowStockItems, setLowStockItems] = useState(0);
  const [topSellingProduct, setTopSellingProduct] = useState("-");
  const [recent, setRecent] = useState<Sale[]>([]);
  const [chartData, setChartData] = useState<{ day: string; total: number }[]>([]);

  useEffect(() => {
    const run = async () => {
      const dayStart = new Date();
      dayStart.setHours(0, 0, 0, 0);

      const { data: sales } = await supabase
        .from("sales")
        .select("id,total,created_at")
        .order("created_at", { ascending: false });
      const allSales = sales ?? [];
      const todaySales = allSales.filter((s) => new Date(s.created_at) >= dayStart);
      setSalesToday(todaySales.length);
      setRevenueToday(todaySales.reduce((acc, s) => acc + Number(s.total), 0));
      setRecent(allSales.slice(0, 8));

      const { data: products } = await supabase.from("products").select("id,stock_quantity,low_stock_threshold");
      setLowStockItems((products ?? []).filter((p) => p.stock_quantity <= p.low_stock_threshold).length);

      const { data: topRows } = await supabase.from("sale_items").select("quantity,products(name)");
      const frequency: Record<string, number> = {};
      ((topRows ?? []) as SaleItemJoin[]).forEach((row) => {
        const name = row.products?.name ?? "Unknown";
        frequency[name] = (frequency[name] ?? 0) + Number(row.quantity);
      });
      const top = Object.entries(frequency).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";
      setTopSellingProduct(top);

      const days = [];
      for (let i = 6; i >= 0; i -= 1) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const start = new Date(d);
        const end = new Date(d);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        const total = allSales
          .filter((s) => new Date(s.created_at) >= start && new Date(s.created_at) <= end)
          .reduce((acc, s) => acc + Number(s.total), 0);
        days.push({ day: d.toLocaleDateString("en-US", { weekday: "short" }), total });
      }
      setChartData(days);
    };
    void run();
  }, [supabase]);

  const revenueLabel = useMemo(() => `$${revenueToday.toFixed(2)}`, [revenueToday]);

  return (
    <div>
      <PageTitle title="Dashboard" subtitle="Store health at a glance" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Total Sales Today" value={String(salesToday)} />
        <MetricCard label="Total Revenue" value={revenueLabel} />
        <MetricCard label="Low Stock Items" value={String(lowStockItems)} />
        <MetricCard label="Top Selling Product" value={topSellingProduct} />
      </div>

      <div className="card p-4 mb-6">
        <h3 className="font-medium mb-3">Sales Over Last 7 Days</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="#5B8A72" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-4">
        <h3 className="font-medium mb-3">Recent Transactions</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th>ID</th>
              <th>Total</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="py-2">{row.id.slice(0, 8)}</td>
                <td>${Number(row.total).toFixed(2)}</td>
                <td>{new Date(row.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
