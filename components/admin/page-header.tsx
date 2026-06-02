import type { ReactNode } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import styles from "@/app/admin/admin.module.css";

export function PageHeader({
  title,
  actions,
}: {
  title: string;
  actions?: ReactNode;
}) {
  return (
    <div className={styles.pageHeader}>
      <h1 className={styles.pageTitle}>{title}</h1>
      <div className={styles.pageActions}>
        {actions ?? (
          <Link
            href="/child/1"
            className={`${styles.btn} ${styles.btnOutline}`}
          >
            <Sparkles size={14} strokeWidth={2} />
            进入孩子模式
          </Link>
        )}
      </div>
    </div>
  );
}
