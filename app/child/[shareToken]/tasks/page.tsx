import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getChildByShareToken } from "@/lib/queries/children";
import { getTasksForChildByShareToken } from "@/lib/queries/tasks";
import { getAuditsForChild } from "@/lib/queries/task-audit";
import { ChildShell } from "@/components/child/child-shell";
import { TaskCard } from "@/components/child/task-card";
import { WishTabs } from "@/components/child/wish-tabs";
import { submitTaskAction } from "@/lib/actions";
import type { ChildTask } from "@/lib/ui-types";
import styles from "@/app/child/child.module.css";

export const metadata = {
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ shareToken: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export default function ChildTasksPage({ params, searchParams }: Props) {
  return (
    <Suspense fallback={null}>
      <ChildTasksPageInner params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function ChildTasksPageInner({ params, searchParams }: Props) {
  const { shareToken } = await params;
  const { tab = "todo" } = await searchParams;
  const child = await getChildByShareToken(shareToken);
  if (!child) notFound();

  const [taskRows, allAudits] = await Promise.all([
    getTasksForChildByShareToken(shareToken),
    getAuditsForChild(shareToken, "all"),
  ]);

  const auditByTask = new Map<number, { id: number; status: string }>();
  for (const a of allAudits) auditByTask.set(a.taskId, { id: a.id, status: a.auditStatus });

  const todoTasks: ChildTask[] = [];
  const pendingTasks: ChildTask[] = [];
  const doneTasks: ChildTask[] = [];

  for (const t of taskRows) {
    const a = auditByTask.get(t.id);
    const item: ChildTask = {
      id: t.id,
      name: t.name,
      detail: t.cycle === "daily" ? "每天可做" : t.cycle === "weekly" ? "每周可做" : "一次性任务",
      icon: t.icon,
      iconClass: iconClassFor(t.icon),
      points: t.points,
      status: "todo",
      assignedChildIds: t.assignedChildren,
      auditId: a?.id,
    };
    if (!a) todoTasks.push(item);
    else if (a.status === "pending") pendingTasks.push({ ...item, status: "pending" });
    else if (a.status === "agree") doneTasks.push({ ...item, status: "done" });
  }

  const tabs = [
    { key: "todo", label: "可做任务", icon: "⚡", count: todoTasks.length },
    { key: "pending", label: "审核中", icon: "🔍", count: pendingTasks.length },
    { key: "done", label: "已完成", icon: "🏆", count: doneTasks.length },
  ];

  const emptyMessages: Record<string, { emoji: string; title: string; desc: string }> = {
    todo: { emoji: "✨", title: "今天任务全部完成啦!", desc: "你真是太棒了,快去看看有没有新任务吧" },
    pending: { emoji: "🔍", title: "没有等待审核的任务", desc: "完成任务后提交,等妈妈爸爸通过就能拿到星星啦" },
    done: { emoji: "📋", title: "还没有完成过任务", desc: "去可做任务里开始第一个任务吧" },
  };

  const currentEmpty = emptyMessages[tab] ?? emptyMessages.todo;
  const currentList = tab === "pending" ? pendingTasks : tab === "done" ? doneTasks : todoTasks;

  const handleSubmit = async (taskId: number) => {
    "use server";
    await submitTaskAction(String(taskId));
  };

  return (
    <ChildShell child={child}>
      <div className={styles.content}>
        <div className={styles.sectionTitle}>
          <span className={styles.sectionTitleEmoji}>📋</span>
          任务大厅
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
            <div className={styles.emptyEmoji}>{currentEmpty.emoji}</div>
            <div className={styles.emptyTitle}>{currentEmpty.title}</div>
            <div>{currentEmpty.desc}</div>
          </div>
        )}
      </div>
    </ChildShell>
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
