"use client";

import { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { createClient } from "@/lib/supabase/client";
import { PageTitle } from "@/components/shared";

type Product = {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  price: number;
  cost: number;
  stock_quantity: number;
};

type CartItem = Product & { qty: number };

export default function POSPage() {
  const supabase = createClient();
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [discountValue, setDiscountValue] = useState(0);
  const taxRate = 0.1;

  useEffect(() => {
    void supabase
      .from("products")
      .select("id,name,sku,barcode,price,cost,stock_quantity")
      .order("name")
      .then(({ data }) => setProducts((data ?? []) as Product[]));
  }, [supabase]);

  const filtered = useMemo(
    () => products.filter((p) => `${p.name} ${p.barcode ?? ""}`.toLowerCase().includes(query.toLowerCase())),
    [products, query],
  );

  const subtotal = cart.reduce((acc, item) => acc + Number(item.price) * item.qty, 0);
  const discount = discountType === "percent" ? subtotal * (discountValue / 100) : discountValue;
  const taxable = Math.max(0, subtotal - discount);
  const tax = taxable * taxRate;
  const total = taxable + tax;

  const addToCart = (p: Product) => {
    setCart((prev) => {
      const existing = prev.find((x) => x.id === p.id);
      if (!existing) return [...prev, { ...p, qty: 1 }];
      return prev.map((x) => (x.id === p.id ? { ...x, qty: x.qty + 1 } : x));
    });
  };

  const checkout = async () => {
    if (!cart.length) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .insert({
        cashier_id: user.id,
        subtotal,
        discount_type: discountType,
        discount_value: discountValue,
        tax,
        total,
      })
      .select("id")
      .single();
    if (saleError || !sale) {
      alert(saleError?.message ?? "Failed to process sale.");
      return;
    }

    const items = cart.map((c) => ({
      sale_id: sale.id,
      product_id: c.id,
      quantity: c.qty,
      unit_price: c.price,
      cost_price: c.cost,
      line_total: c.qty * c.price,
    }));
    const { error: itemError } = await supabase.from("sale_items").insert(items);
    if (itemError) {
      alert(itemError.message);
      return;
    }

    for (const item of cart) {
      await supabase.from("products").update({ stock_quantity: item.stock_quantity - item.qty }).eq("id", item.id);
      await supabase
        .from("inventory_logs")
        .insert({ product_id: item.id, change_type: "sale", quantity_change: -item.qty, note: `Sale ${sale.id}` });
    }

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("ChillPOS Receipt", 14, 16);
    autoTable(doc, {
      startY: 24,
      head: [["Item", "Qty", "Price", "Line"]],
      body: cart.map((i) => [i.name, String(i.qty), `$${Number(i.price).toFixed(2)}`, `$${(i.qty * Number(i.price)).toFixed(2)}`]),
    });
    doc.text(`Subtotal: $${subtotal.toFixed(2)}`, 14, 180);
    doc.text(`Tax: $${tax.toFixed(2)}`, 14, 188);
    doc.text(`Total: $${total.toFixed(2)}`, 14, 196);
    doc.save(`receipt-${sale.id.slice(0, 8)}.pdf`);

    setCart([]);
    alert("Sale completed.");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <PageTitle title="POS" subtitle="Search products by name or barcode" />
        <input
          className="input mb-4"
          placeholder="Search or scan product"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((p) => (
            <button key={p.id} className="card p-4 text-left hover:shadow-md" onClick={() => addToCart(p)}>
              <p className="font-medium">{p.name}</p>
              <p className="text-xs text-slate-500">SKU: {p.sku}</p>
              <p className="mt-2">${Number(p.price).toFixed(2)} • Stock {p.stock_quantity}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="card p-4 h-fit sticky top-6">
        <h3 className="font-medium mb-3">Cart</h3>
        <div className="space-y-2 max-h-72 overflow-auto">
          {cart.map((c) => (
            <div key={c.id} className="border-b border-slate-100 pb-2">
              <p className="font-medium">{c.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <input
                  className="input w-24"
                  type="number"
                  min={1}
                  value={c.qty}
                  onChange={(e) =>
                    setCart((prev) =>
                      prev.map((p) => (p.id === c.id ? { ...p, qty: Math.max(1, Number(e.target.value) || 1) } : p)),
                    )
                  }
                />
                <span className="text-sm">${(c.qty * Number(c.price)).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex gap-2">
            <select className="input" value={discountType} onChange={(e) => setDiscountType(e.target.value as "percent" | "fixed")}>
              <option value="percent">%</option>
              <option value="fixed">$</option>
            </select>
            <input className="input" type="number" value={discountValue} onChange={(e) => setDiscountValue(Number(e.target.value) || 0)} />
          </div>
          <p>Subtotal: ${subtotal.toFixed(2)}</p>
          <p>Tax: ${tax.toFixed(2)}</p>
          <p className="text-lg font-semibold">Total: ${total.toFixed(2)}</p>
        </div>
        <button className="btn-primary w-full mt-4" onClick={() => void checkout()}>
          Process Sale
        </button>
      </div>
    </div>
  );
}
