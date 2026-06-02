import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { FloatingActions } from "./floating-actions";
import { children } from "@/lib/mock-data";
import styles from "@/app/admin/admin.module.css";

export function AdminShell({ children: pageContent }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <Sidebar />
      <main className={styles.main}>{pageContent}</main>
      <FloatingActions kidsList={children} />
    </div>
  );
}
