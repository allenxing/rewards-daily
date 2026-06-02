import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getChildById, getChildTasksForChild } from "@/lib/mock-data";
import { ChildShell } from "@/components/child/child-shell";
import { TaskCard } from "@/components/child/task-card";
import { WishTabs } from "@/components/child/wish-tabs";
import { submitTaskAction } from "@/lib/actions";
import styles from "@/app/child/child.module.css";

type Props = {
  params: Promise<{ childId: string }>;
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
  const { childId } = await params;
  const { tab = "todo" } = await searchParams;
  const child = getChildById(childId);
  if (!child) notFound();

  const allTasks = getChildTasksForChild(childId);
  const todoTasks = allTasks.filter((t) => t.status === "todo");
  const pendingTasks = allTasks.filter((t) => t.status === "pending");
  const doneTasks = allTasks.filter((t) => t.status === "done");

  const tabs = [
    { key: "todo", label: "可做任务", icon: "⚡", count: todoTasks.length },
    { key: "pending", label: "审核中", icon: "🔍", count: pendingTasks.length },
    { key: "done", label: "已完成", icon: "🏆", count: doneTasks.length },
  ];

  const emptyMessages: Record<string, { emoji: string; title: string; desc: string }> = {
    todo: {
      emoji: "✨",
      title: "今天任务全部完成啦!",
      desc: "你真是太棒了,快去看看有没有新任务吧",
    },
    pending: {
      emoji: "🔍",
      title: "没有等待审核的任务",
      desc: "完成任务后提交,等妈妈爸爸通过就能拿到星星啦",
    },
    done: {
      emoji: "📋",
      title: "还没有完成过任务",
      desc: "去可做任务里开始第一个任务吧",
    },
  };

  const currentEmpty = emptyMessages[tab] ?? emptyMessages.todo;
  const currentList =
    tab === "pending" ? pendingTasks : tab === "done" ? doneTasks : todoTasks;

  const handleSubmit = async (taskId: string) => {
    "use server";
    await submitTaskAction(taskId);
  };

  return (
    <ChildShell child={child}>
      <div className={styles.content}>
        <div className={styles.sectionTitle}>
          <span className={styles.sectionTitleEmoji}>📋</span>
          任务大厅
        </div>

        <WishTabs tabs={tabs} active={tab} basePath={`/child/${childId}/tasks`} />

        {currentList.length > 0 ? (
          currentList.map((task) => (
            <TaskCard key={task.id} task={task} onSubmit={handleSubmit} />
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
