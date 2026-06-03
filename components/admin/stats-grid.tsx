import { ClipboardList, Star, CheckCircle2, Sparkles } from "lucide-react";
import { StatCard } from "./stat-card";
import type { DashboardStats } from "@/lib/queries/dashboard";
import styles from "@/app/admin/admin.module.css";

type Props = {
  stats: DashboardStats;
};

export function StatsGrid({ stats }: Props) {
  return (
    <div className={styles.statsGrid}>
      <StatCard
        icon={<ClipboardList size={24} strokeWidth={2} />}
        value={String(stats.pendingReview)}
        label="今日待审核"
        tone="warning"
      />
      <StatCard
        icon={<Star size={24} strokeWidth={2} />}
        value={stats.totalPoints.toLocaleString()}
        label="孩子总积分"
        tone="primary"
      />
      <StatCard
        icon={<CheckCircle2 size={24} strokeWidth={2} />}
        value={String(stats.completedToday)}
        label="今日已完成"
        tone="success"
      />
      <StatCard
        icon={<Sparkles size={24} strokeWidth={2} />}
        value={String(stats.pendingWishes)}
        label="待达成愿望"
        tone="info"
      />
    </div>
  );
}
