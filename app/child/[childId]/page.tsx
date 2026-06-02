import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getChildById, getChildTasksForChild, getChildWishesForChild } from "@/lib/mock-data";
import { ChildShell } from "@/components/child/child-shell";
import { TaskCard } from "@/components/child/task-card";
import { WishCard } from "@/components/child/wish-card";
import { submitTaskAction } from "@/lib/actions";
import styles from "@/app/child/child.module.css";

type Props = {
  params: Promise<{ childId: string }>;
};

export default function ChildHomePage({ params }: Props) {
  return (
    <Suspense fallback={null}>
      <ChildHomePageInner params={params} />
    </Suspense>
  );
}

async function ChildHomePageInner({ params }: Props) {
  const { childId } = await params;
  const child = getChildById(childId);
  if (!child) notFound();

  const allTasks = getChildTasksForChild(childId);
  const todoTasks = allTasks.filter((t) => t.status === "todo");
  const wishes = getChildWishesForChild(childId);

  const handleSubmit = async (taskId: string) => {
    "use server";
    await submitTaskAction(taskId);
  };

  return (
    <ChildShell child={child}>
      <div className={styles.content}>
        <div className={styles.sectionTitle}>
          <span className={styles.sectionTitleEmoji}>📅</span>
          今日任务
        </div>

        {todoTasks.map((task) => (
          <TaskCard key={task.id} task={task} onSubmit={handleSubmit} />
        ))}

        <div className={`${styles.sectionTitle} ${styles.sectionGap}`}>
          <span className={styles.sectionTitleEmoji}>🎉</span>
          我的梦想
        </div>
        <div className={styles.wishScroll}>
          {wishes.map((wish) => (
            <WishCard key={wish.id} wish={wish} childId={childId} variant="scroll" />
          ))}
        </div>
      </div>
    </ChildShell>
  );
}
