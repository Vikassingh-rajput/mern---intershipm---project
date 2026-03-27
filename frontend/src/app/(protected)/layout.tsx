import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LayoutShell } from "@/components/layout-shell";

type Role = "admin" | "cashier";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  const role = (profile?.role ?? "cashier") as Role;

  return <LayoutShell role={role}>{children}</LayoutShell>;
}
