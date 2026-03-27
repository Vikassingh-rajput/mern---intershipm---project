"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Column = { key: string; label: string; type?: "text" | "number" };
type CrudRow = Record<string, string | number | null> & { id: string; created_at?: string };

export function SimpleCrud({
  table,
  columns,
  title,
  adminOnly = false,
}: {
  table: string;
  columns: Column[];
  title: string;
  adminOnly?: boolean;
}) {
  const supabase = createClient();
  const [rows, setRows] = useState<CrudRow[]>([]);
  const [form, setForm] = useState<Record<string, string | number | null>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [canManage, setCanManage] = useState(!adminOnly);

  const load = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (adminOnly && userData.user) {
      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", userData.user.id)
        .single();
      setCanManage(profile?.role === "admin");
    }

    const { data } = await supabase.from(table).select("*").order("created_at", { ascending: false });
    setRows((data ?? []) as CrudRow[]);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;
    if (editing) await supabase.from(table).update(form).eq("id", editing);
    else await supabase.from(table).insert(form);
    setForm({});
    setEditing(null);
    await load();
  };

  const remove = async (id: string) => {
    if (!canManage) return;
    await supabase.from(table).delete().eq("id", id);
    await load();
  };

  const filtered = rows.filter((row) => JSON.stringify(row).toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <h3 className="font-medium mb-3">{title}</h3>
        <input className="input mb-3" placeholder="Search..." value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c.key} className="text-left py-2">
                    {c.label}
                  </th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  {columns.map((c) => (
                    <td key={c.key} className="py-2 pr-2">
                      {String(r[c.key] ?? "")}
                    </td>
                  ))}
                  <td className="py-2 space-x-2">
                    <button className="text-sky-700" onClick={() => { setEditing(r.id); setForm(r); }} disabled={!canManage}>
                      Edit
                    </button>
                    <button className="text-rose-700" onClick={() => void remove(r.id)} disabled={!canManage}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <form onSubmit={(e) => void submit(e)} className="card p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        {columns.map((c) => (
          <input
            key={c.key}
            className="input"
            type={c.type ?? "text"}
            placeholder={c.label}
            value={form[c.key] ?? ""}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                [c.key]: c.type === "number" ? Number(e.target.value) : e.target.value,
              }))
            }
          />
        ))}
        <button className="btn-primary md:col-span-2" type="submit" disabled={!canManage}>
          {editing ? "Update" : "Create"}
        </button>
      </form>
    </div>
  );
}
