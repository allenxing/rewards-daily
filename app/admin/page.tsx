import { getTranslations } from "next-intl/server";
import { StatsGrid } from "@/components/admin/stats-grid";
import { ReviewSection } from "@/components/admin/review-section";
import { getDashboardStats, getChildSummaries } from "@/lib/queries/dashboard";
import { getPendingAudits, toReviewItem } from "@/lib/queries/task-audit";
import styles from "./admin.module.css";

export default async function AdminDashboardPage() {
  const t = await getTranslations("admin.dashboard");
  const [stats, , audits] = await Promise.all([
    getDashboardStats(),
    getChildSummaries(),
    getPendingAudits(20),
  ]);
  const reviews = audits.map(toReviewItem);
  return (
    <>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{t("pageTitle")}</h1>
      </div>
      <div className={styles.pageBody}>
        <StatsGrid stats={stats} />
        <ReviewSection stats={stats} reviews={reviews} />
      </div>
    </>
  );
}
