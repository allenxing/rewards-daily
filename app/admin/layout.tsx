import { AdminShell } from "@/components/admin/admin-shell";
import { createClient } from "@/lib/supabase/server";
import { getChildren } from "@/lib/queries";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const kids = await getChildren();
  return <AdminShell kids={kids} userEmail={user?.email ?? ""}>{children}</AdminShell>;
}
