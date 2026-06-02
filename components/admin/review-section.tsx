import { ReviewList } from "./review-list";
import { dashboardStats } from "@/lib/mock-data";
import styles from "@/app/admin/admin.module.css";

export function ReviewSection() {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>待审核任务</h3>
        <span className={`${styles.badge} ${styles.badgeWarning}`}>
          {dashboardStats.pendingReview} 项待处理
        </span>
      </div>
      <ReviewList />
    </div>
  );
}
