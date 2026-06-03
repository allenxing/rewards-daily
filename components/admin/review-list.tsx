import { CheckCircle } from "lucide-react";
import { ReviewItem } from "./review-item";
import type { ReviewItem as ReviewItemData } from "@/lib/ui-types";
import styles from "@/app/admin/admin.module.css";

export function ReviewList({ items }: { items: ReviewItemData[] }) {
  if (items.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyStateIcon}>
          <CheckCircle size={48} strokeWidth={1.5} />
        </div>
        <div className={styles.emptyStateText}>没有待审核任务</div>
      </div>
    );
  }
  return (
    <div className={styles.reviewList}>
      {items.map((item) => (
        <ReviewItem key={item.id} item={item} />
      ))}
    </div>
  );
}
