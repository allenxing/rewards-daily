import { getTranslations } from "next-intl/server";
import { ReviewList } from "./review-list";
import type { ReviewItem } from "@/lib/ui-types";
import type { DashboardStats } from "@/lib/queries/dashboard";
import styles from "@/app/admin/admin.module.css";

type Props = {
  stats: DashboardStats;
  reviews: ReviewItem[];
};

export async function ReviewSection({ stats, reviews }: Props) {
  const t = await getTranslations("admin.review");
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>{t("sectionTitle")}</h3>
        <span className={`${styles.badge} ${styles.badgeWarning}`}>
          {stats.pendingReview} {t("pendingCount")}
        </span>
      </div>
      <ReviewList items={reviews} />
    </div>
  );
}
