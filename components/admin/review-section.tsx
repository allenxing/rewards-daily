import { ReviewList } from "./review-list";
import type { ReviewItem } from "@/lib/ui-types";
import type { DashboardStats } from "@/lib/queries/dashboard";
import styles from "@/app/admin/admin.module.css";

type Props = {
  stats: DashboardStats;
  reviews: ReviewItem[];
};

export function ReviewSection({ stats, reviews }: Props) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>待审核任务</h3>
        <span className={`${styles.badge} ${styles.badgeWarning}`}>
          {stats.pendingReview} 项待处理
        </span>
      </div>
      <ReviewList items={reviews} />
    </div>
  );
}
