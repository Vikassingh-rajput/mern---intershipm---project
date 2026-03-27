"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Boxes,
  Home,
  LogOut,
  ReceiptText,
  ShoppingCart,
  Tags,
  Truck,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Role = "admin" | "cashier";

const baseLinks = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/pos", label: "POS", icon: ShoppingCart },
  { href: "/inventory", label: "Inventory", icon: Boxes },
  { href: "/categories", label: "Categories", icon: Tags },
  { href: "/suppliers", label: "Suppliers", icon: Truck },
  { href: "/purchase-orders", label: "Purchase Orders", icon: ReceiptText },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

export function LayoutShell({ children, role }: { children: React.ReactNode; role: Role }) {
  const pathname = usePathname();
  const router = useRouter();
  const links = role === "admin" ? [...baseLinks, { href: "/users", label: "Users", icon: Users }] : baseLinks;

  const onLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 p-4 text-white" style={{ background: "var(--bg-sidebar)" }}>
        <h1 className="text-xl font-bold mb-6">ChillPOS</h1>
        <nav className="space-y-2">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 ${
                pathname === href ? "bg-white/15" : "hover:bg-white/10"
              }`}
            >
              <Icon size={18} /> {label}
            </Link>
          ))}
        </nav>
        <button
          onClick={onLogout}
          className="mt-8 flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-white/10 w-full text-left"
        >
          <LogOut size={18} /> Logout
        </button>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
