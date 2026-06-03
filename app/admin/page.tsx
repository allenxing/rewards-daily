import { PageHeader } from "@/components/admin/page-header";
import { StatsGrid } from "@/components/admin/stats-grid";
import { ReviewSection } from "@/components/admin/review-section";
import { getDashboardStats, getChildSummaries } from "@/lib/queries/dashboard";
import { getPendingAudits, toReviewItem } from "@/lib/queries/task-audit";
import styles from "./admin.module.css";

export default async function AdminDashboardPage() {
  const [stats, , audits] = await Promise.all([
    getDashboardStats(),
    getChildSummaries(),
    getPendingAudits(20),
  ]);
  const reviews = audits.map(toReviewItem);
  return (
    <>
      <PageHeader title="控制台首页" />
      <div className={styles.pageBody}>
        <StatsGrid stats={stats} />
        <ReviewSection stats={stats} reviews={reviews} />
      </div>
    </>
  );
}
