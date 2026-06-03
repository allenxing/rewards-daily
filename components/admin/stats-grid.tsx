import { ClipboardList, Star, CheckCircle2, Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { StatCard } from "./stat-card";
import type { DashboardStats } from "@/lib/queries/dashboard";
import styles from "@/app/admin/admin.module.css";

type Props = {
  stats: DashboardStats;
};

export async function StatsGrid({ stats }: Props) {
  const t = await getTranslations("admin.dashboard.stats");
  return (
    <div className={styles.statsGrid}>
      <StatCard
        icon={<ClipboardList size={24} strokeWidth={2} />}
        value={String(stats.pendingReview)}
        label={t("pendingReview")}
        tone="warning"
      />
      <StatCard
        icon={<Star size={24} strokeWidth={2} />}
        value={stats.totalPoints.toLocaleString()}
        label={t("totalPoints")}
        tone="primary"
      />
      <StatCard
        icon={<CheckCircle2 size={24} strokeWidth={2} />}
        value={String(stats.completedToday)}
        label={t("completedToday")}
        tone="success"
      />
      <StatCard
        icon={<Sparkles size={24} strokeWidth={2} />}
        value={String(stats.pendingWishes)}
        label={t("wishesPending")}
        tone="info"
      />
    </div>
  );
}
