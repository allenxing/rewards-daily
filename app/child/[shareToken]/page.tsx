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

  const [taskRows, audits, wishes] = await Promise.all([
    getTasksForChildByShareToken(shareToken),
    getAuditsForChild(shareToken, "pending"),
    getWishesForChild(shareToken),
  ]);

  const auditByTask = new Map<number, number>();
  for (const a of audits) auditByTask.set(a.taskId, a.id);

  const todoTasks: ChildTask[] = taskRows.map((t) => ({
    id: t.id,
    name: t.name,
    detail: t.cycle === "daily" ? "每天可做" : t.cycle === "weekly" ? "每周可做" : "一次性任务",
    icon: t.icon,
    iconClass: iconClassFor(t.icon),
    points: t.points,
    status: auditByTask.has(t.id) ? "pending" : "todo",
    assignedChildIds: t.assignedChildren,
    auditId: auditByTask.get(t.id),
  }));

  const handleSubmit = async (taskId: number) => {
    "use server";
    await submitTaskAction(shareToken, String(taskId));
  };

  return (
    <div className={styles.content}>
      <div className={styles.sectionTitle}>
        <span className={styles.sectionTitleEmoji}>📅</span>
        今日任务
      </div>

      {todoTasks.length === 0 ? (
        <div className={styles.empty}>
          <PartyPopper size={48} strokeWidth={1.5} className={styles.emptyEmoji} />
          <div className={styles.emptyTitle}>今天全部完成啦!</div>
          <div>太棒了,快去梦想宝库看看有没有想兑换的吧</div>
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
        我的梦想
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
