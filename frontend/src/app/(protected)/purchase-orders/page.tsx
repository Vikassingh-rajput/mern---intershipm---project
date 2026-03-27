"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageTitle } from "@/components/shared";

export default function PurchaseOrdersPage() {
  const supabase = createClient();
  const [supplierId, setSupplierId] = useState("");
  const [orders, setOrders] = useState<
    { id: string; status: string; created_at: string }[]
  >([]);

  const load = async () => {
    const { data } = await supabase.from("purchase_orders").select("*").order("created_at", { ascending: false });
    setOrders(data ?? []);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, []);

  const createOrder = async () => {
    await supabase.from("purchase_orders").insert({ supplier_id: supplierId || null, status: "pending" });
    setSupplierId("");
    await load();
  };

  const markReceived = async (orderId: string) => {
    await supabase
      .from("purchase_orders")
      .update({ status: "received", received_at: new Date().toISOString() })
      .eq("id", orderId);
    await load();
  };

  return (
    <div>
      <PageTitle title="Purchase Orders" subtitle="Restock products from suppliers" />
      <div className="card p-4 mb-4 flex gap-2">
        <input
          className="input"
          placeholder="Supplier ID (optional)"
          value={supplierId}
          onChange={(e) => setSupplierId(e.target.value)}
        />
        <button className="btn-primary" onClick={() => void createOrder()}>
          Create PO
        </button>
      </div>

      <div className="card p-4 overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th>ID</th>
              <th>Status</th>
              <th>Created</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-t border-slate-100">
                <td className="py-2">{order.id.slice(0, 8)}</td>
                <td>{order.status}</td>
                <td>{new Date(order.created_at).toLocaleString()}</td>
                <td>
                  <button
                    className="text-sky-700 disabled:text-slate-400"
                    disabled={order.status === "received"}
                    onClick={() => void markReceived(order.id)}
                  >
                    Mark Received
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
