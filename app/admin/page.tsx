import { PageHeader } from "@/components/admin/page-header";
import { StatsGrid } from "@/components/admin/stats-grid";
import { ReviewSection } from "@/components/admin/review-section";
import styles from "./admin.module.css";

export default function AdminDashboardPage() {
  return (
    <>
      <PageHeader title="控制台首页" />
      <div className={styles.pageBody}>
        <StatsGrid />
        <ReviewSection />
      </div>
    </>
  );
}
