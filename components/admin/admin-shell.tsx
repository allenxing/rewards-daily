import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { FloatingActions } from "./floating-actions";
import type { Child } from "@/lib/ui-types";
import styles from "@/app/admin/admin.module.css";

export function AdminShell({
  kids,
  children: pageContent,
}: {
  kids: Child[];
  children: ReactNode;
}) {
  return (
    <div className={styles.shell}>
      <Sidebar />
      <main className={styles.main}>{pageContent}</main>
      <FloatingActions kidsList={kids} />
    </div>
  );
}
