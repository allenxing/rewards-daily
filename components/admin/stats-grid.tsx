import { ClipboardList, Star, CheckCircle2, Sparkles } from "lucide-react";
import { StatCard } from "./stat-card";
import { dashboardStats } from "@/lib/mock-data";
import styles from "@/app/admin/admin.module.css";

export function StatsGrid() {
  return (
    <div className={styles.statsGrid}>
      <StatCard
        icon={<ClipboardList size={24} strokeWidth={2} />}
        value={String(dashboardStats.pendingReview)}
        label="今日待审核"
        tone="warning"
      />
      <StatCard
        icon={<Star size={24} strokeWidth={2} />}
        value={dashboardStats.totalPoints.toLocaleString()}
        label="孩子总积分"
        tone="primary"
      />
      <StatCard
        icon={<CheckCircle2 size={24} strokeWidth={2} />}
        value={String(dashboardStats.completedToday)}
        label="今日已完成"
        tone="success"
      />
      <StatCard
        icon={<Sparkles size={24} strokeWidth={2} />}
        value={String(dashboardStats.pendingWishes)}
        label="待达成愿望"
        tone="info"
      />
    </div>
  );
}
