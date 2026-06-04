import { getTranslations } from "next-intl/server";
import { PartyPopper } from "lucide-react";
import { getTasksForChildByShareToken } from "@/lib/queries/tasks";
import { getAuditsForChild } from "@/lib/queries/task-audit";
import { getWishesForChild } from "@/lib/queries/wishes";
import { TaskCard } from "@/components/child/task-card";
import { WishCard } from "@/components/child/wish-card";
import { submitTaskAction } from "@/lib/actions";
import type { ChildTask } from "@/lib/ui-types";
import styles from "@/app/child/child.module.css";

type Props = {
  params: Promise<{ shareToken: string }>;
};

export default async function ChildHomePage({ params }: Props) {
  const { shareToken } = await params;
  const t = await getTranslations("child.home");

  const [taskRows, audits, wishes] = await Promise.all([
    getTasksForChildByShareToken(shareToken),
    getAuditsForChild(shareToken, "pending"),
    getWishesForChild(shareToken),
  ]);

  const pendingTaskIds = new Set<number>();
  for (const a of audits) pendingTaskIds.add(a.taskId);

  const todoTasks: ChildTask[] = taskRows.map((row) => ({
    id: row.id,
    name: row.name,
    detail: row.cycle === "daily" ? t("taskCycleDaily") : row.cycle === "weekly" ? t("taskCycleWeekly") : t("taskCycleOnce"),
    icon: row.icon,
    iconClass: iconClassFor(row.icon),
    points: row.points,
    status: pendingTaskIds.has(row.id) ? "pending" : "todo",
    assignedChildIds: row.assignedChildren,
    auditId: undefined,
  }));

  const handleSubmit = async (taskId: number) => {
    "use server";
    await submitTaskAction(shareToken, String(taskId));
  };

  return (
    <div className={styles.content}>
      <div className={styles.sectionTitle}>
        <span className={styles.sectionTitleEmoji}>📅</span>
        {t("sectionTasks")}
      </div>

      {todoTasks.length === 0 ? (
        <div className={styles.empty}>
          <PartyPopper size={48} strokeWidth={1.5} className={styles.emptyEmoji} />
          <div className={styles.emptyTitle}>{t("empty.title")}</div>
          <div>{t("empty.desc")}</div>
        </div>
      ) : (
        todoTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            shareToken={shareToken}
            onSubmit={handleSubmit}
          />
        ))
      )}

      <div className={`${styles.sectionTitle} ${styles.sectionGap}`}>
        <span className={styles.sectionTitleEmoji}>🎉</span>
        {t("sectionWishes")}
      </div>
      <div className={styles.wishScroll}>
        {wishes.map((wish) => (
          <WishCard key={wish.id} wish={wish} shareToken={shareToken} variant="scroll" />
        ))}
      </div>
    </div>
  );
}

function iconClassFor(icon: string): string {
  if (icon === "💧") return "brush";
  if (icon === "📚") return "read";
  if (icon === "🎳") return "exercise";
  if (icon === "🧹") return "organize";
  if (icon === "💌" || icon === "💕") return "pink";
  return "organize";
}
