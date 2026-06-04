import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { ClipboardList, Clock, Trophy } from "lucide-react";
import { getTasksForChildByShareToken } from "@/lib/queries/tasks";
import { getAuditsForChild } from "@/lib/queries/task-audit";
import { getRecordsForChild } from "@/lib/queries/points-records";
import { TaskCard } from "@/components/child/task-card";
import { WishTabs } from "@/components/child/wish-tabs";
import { submitTaskAction } from "@/lib/actions";
import type { ChildTask } from "@/lib/ui-types";
import styles from "@/app/child/child.module.css";

type Props = {
  params: Promise<{ shareToken: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export default async function ChildTasksPage({ params, searchParams }: Props) {
  const { shareToken } = await params;
  const { tab = "todo" } = await searchParams;
  const t = await getTranslations("child.tasks");

  const [taskRows, allAudits, records] = await Promise.all([
    getTasksForChildByShareToken(shareToken),
    getAuditsForChild(shareToken, "all"),
    getRecordsForChild(shareToken),
  ]);

  const auditByTask = new Map<number, { id: number; status: string }>();
  for (const a of allAudits) {
    if (!auditByTask.has(a.taskId)) {
      auditByTask.set(a.taskId, { id: a.id, status: a.auditStatus });
    }
  }

  const todoTasks: ChildTask[] = [];
  const pendingTasks: ChildTask[] = [];
  const doneTasks: ChildTask[] = [];

  for (const row of taskRows) {
    const a = auditByTask.get(row.id);
    const status: ChildTask["status"] = !a ? "todo" : a.status === "pending" ? "pending" : "done";
    const item: ChildTask = {
      id: row.id,
      name: row.name,
      detail: row.cycle === "daily" ? t("cycleDaily") : row.cycle === "weekly" ? t("cycleWeekly") : t("cycleOnce"),
      icon: row.icon,
      iconClass: iconClassFor(row.icon),
      points: row.points,
      status,
      assignedChildIds: row.assignedChildren,
      auditId: a?.id,
    };
    if (status === "pending") pendingTasks.push(item);
    else if (status === "done") doneTasks.push(item);
    else todoTasks.push(item);
  }

  for (const r of records) {
    const isAdd = r.recordType === "manual";
    doneTasks.push({
      id: -(r.id + 1000),
      name: r.remark || (isAdd ? t("manualAdd") : t("manualDeduct")),
      detail: isAdd ? t("manualAdd") : t("manualDeduct"),
      icon: isAdd ? "⭐" : "💔",
      iconClass: "pink",
      points: r.points,
      status: "done",
      assignedChildIds: [],
    });
  }

  const tabs = [
    { key: "todo", label: t("tabTodo"), icon: "⚡", count: todoTasks.length },
    { key: "pending", label: t("tabPending"), icon: "🔍", count: pendingTasks.length },
    { key: "done", label: t("tabDone"), icon: "🏆", count: doneTasks.length },
  ];

  const emptyStates: Record<string, { icon: ReactNode; title: string; desc: string }> = {
    todo: {
      icon: <ClipboardList size={48} strokeWidth={1.5} />,
      title: t("emptyTodo.title"),
      desc: t("emptyTodo.desc"),
    },
    pending: {
      icon: <Clock size={48} strokeWidth={1.5} />,
      title: t("emptyPending.title"),
      desc: t("emptyPending.desc"),
    },
    done: {
      icon: <Trophy size={48} strokeWidth={1.5} />,
      title: t("emptyDone.title"),
      desc: t("emptyDone.desc"),
    },
  };

  const currentEmpty = emptyStates[tab] ?? emptyStates.todo;
  const currentList = tab === "pending" ? pendingTasks : tab === "done" ? doneTasks : todoTasks;

  const handleSubmit = async (taskId: number) => {
    "use server";
    await submitTaskAction(shareToken, String(taskId));
  };

  return (
    <div className={styles.content}>
      <div className={styles.sectionTitle}>
        <span className={styles.sectionTitleEmoji}>📋</span>
        {t("sectionTitle")}
      </div>

      <WishTabs tabs={tabs} active={tab} basePath={`/child/${shareToken}/tasks`} />

      {currentList.length > 0 ? (
        currentList.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            shareToken={shareToken}
            onSubmit={handleSubmit}
          />
        ))
      ) : (
        <div className={styles.empty}>
          <div className={styles.emptyEmoji}>{currentEmpty.icon}</div>
          <div className={styles.emptyTitle}>{currentEmpty.title}</div>
          <div>{currentEmpty.desc}</div>
        </div>
      )}
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
