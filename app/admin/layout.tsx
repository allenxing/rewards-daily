import { Suspense } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { getChildren } from "@/lib/queries";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </Suspense>
  );
}

async function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const kids = await getChildren();
  return <AdminShell kids={kids}>{children}</AdminShell>;
}
