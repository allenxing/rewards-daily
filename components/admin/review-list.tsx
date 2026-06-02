import { dashboardReviews } from "@/lib/mock-data";
import { ReviewItem } from "./review-item";
import styles from "@/app/admin/admin.module.css";

export function ReviewList() {
  return (
    <div className={styles.reviewList}>
      {dashboardReviews.map((item) => (
        <ReviewItem key={item.id} item={item} />
      ))}
    </div>
  );
}
