import { CheckCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ReviewItem } from "./review-item";
import type { ReviewItem as ReviewItemData } from "@/lib/ui-types";
import styles from "@/app/admin/admin.module.css";

export async function ReviewList({ items }: { items: ReviewItemData[] }) {
  const t = await getTranslations("admin.review");
  if (items.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyStateIcon}>
          <CheckCircle size={48} strokeWidth={1.5} />
        </div>
        <div className={styles.emptyStateText}>{t("empty")}</div>
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
