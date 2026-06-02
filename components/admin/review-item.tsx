import { Check, X } from "lucide-react";
import type { ReviewItem as ReviewItemData } from "@/lib/mock-data";
import styles from "@/app/admin/admin.module.css";

export function ReviewItem({ item }: { item: ReviewItemData }) {
  return (
    <div className={styles.reviewItem}>
      <div
        className={styles.avatar}
        style={{ background: item.avatarBg, color: item.avatarFg }}
        aria-hidden
      >
        {item.childName.charAt(0)}
      </div>
      <div className={styles.reviewInfo}>
        <div className={styles.reviewTask}>{item.taskName}</div>
        <div className={styles.reviewMeta}>
          <span>{item.childName}</span>
          <span>{item.submitTime}</span>
          <span className={`${styles.badge} ${styles.badgeSuccess}`}>
            +{item.points} 积分
          </span>
        </div>
      </div>
      <div className={styles.reviewActions}>
        <button type="button" className={`${styles.btn} ${styles.btnSuccess}`}>
          <Check size={14} strokeWidth={2.5} />
          通过
        </button>
        <button type="button" className={`${styles.btn} ${styles.btnOutline}`}>
          <X size={14} strokeWidth={2.5} />
          拒绝
        </button>
      </div>
    </div>
  );
}
