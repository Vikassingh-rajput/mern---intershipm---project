"use client";

import { useState } from "react";
import Papa from "papaparse";
import { createClient } from "@/lib/supabase/client";
import { MetricCard, PageTitle } from "@/components/shared";

export default function ReportsPage() {
  const supabase = createClient();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [rows, setRows] = useState<{ id: string; total: number; created_at: string }[]>([]);
  const [summary, setSummary] = useState({ sales: 0, revenue: 0, profit: 0, top: "-" });

  const runReport = async () => {
    let query = supabase
      .from("sales")
      .select("id,total,created_at,sale_items(quantity,unit_price,cost_price,products(name))")
      .order("created_at", { ascending: false });

    if (startDate) query = query.gte("created_at", new Date(startDate).toISOString());
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query = query.lte("created_at", end.toISOString());
    }

    const { data } = await query;
    const sales = data ?? [];
    setRows(sales);

    const revenue = sales.reduce((acc, s) => acc + Number(s.total), 0);
    const allItems = sales.flatMap(
      (s) =>
        (s.sale_items ?? []) as {
          quantity: number;
          unit_price: number;
          cost_price: number;
          products: { name: string } | null;
        }[],
    );
    const profit = allItems.reduce(
      (acc, i) => acc + (Number(i.unit_price) - Number(i.cost_price)) * Number(i.quantity),
      0,
    );

    const soldByName: Record<string, number> = {};
    allItems.forEach((item) => {
      const key = item.products?.name ?? "Unknown";
      soldByName[key] = (soldByName[key] ?? 0) + item.quantity;
    });
    const top = Object.entries(soldByName).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";

    setSummary({ sales: sales.length, revenue, profit, top });
  };

  const exportCSV = () => {
    const exportRows = rows.map((r) => ({ id: r.id, total: r.total, created_at: r.created_at }));
    const csv = Papa.unparse(exportRows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sales-report.csv";
    link.click();
  };

  return (
    <div>
      <PageTitle title="Sales Reports" subtitle="Filter, analyze, and export sales data" />
      <div className="card p-4 mb-4 flex flex-wrap gap-2">
        <input className="input w-44" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <input className="input w-44" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        <button className="btn-primary" onClick={() => void runReport()}>
          Run Report
        </button>
        <button className="rounded-lg px-4 py-2 border border-slate-200" onClick={exportCSV}>
          Export CSV
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard label="Total Sales" value={String(summary.sales)} />
        <MetricCard label="Total Revenue" value={`$${summary.revenue.toFixed(2)}`} />
        <MetricCard label="Profit" value={`$${summary.profit.toFixed(2)}`} />
        <MetricCard label="Most Sold Product" value={summary.top} />
      </div>
    </div>
  );
}
