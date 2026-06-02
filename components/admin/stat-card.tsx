import type { ReactNode } from "react";
import styles from "@/app/admin/admin.module.css";

type Tone = "warning" | "primary" | "success" | "info";

const toneClass: Record<Tone, string> = {
  warning: styles.statIconWarning,
  primary: styles.statIconPrimary,
  success: styles.statIconSuccess,
  info: styles.statIconInfo,
};

export function StatCard({
  icon,
  value,
  label,
  tone,
}: {
  icon: ReactNode;
  value: string;
  label: string;
  tone: Tone;
}) {
  return (
    <div className={styles.statCard}>
      <div className={`${styles.statIcon} ${toneClass[tone]}`}>{icon}</div>
      <div>
        <div className={styles.statValue}>{value}</div>
        <div className={styles.statLabel}>{label}</div>
      </div>
    </div>
  );
}
