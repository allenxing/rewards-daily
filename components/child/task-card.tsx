"use client";

import { useTransition } from "react";
import type { ChildTask } from "@/lib/ui-types";
import { useToast } from "@/components/common/toast";
import styles from "@/app/child/child.module.css";

type Props = {
  task: ChildTask;
  shareToken: string;
  onSubmit?: (taskId: number) => void;
};

export function TaskCard({ task, shareToken, onSubmit }: Props) {
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  void shareToken;

  if (task.status === "done") {
    return (
      <div className={`${styles.taskCard} ${styles.done}`}>
        <div className={`${styles.taskIcon} ${styles[task.iconClass] ?? ""}`}>
          {task.icon}
        </div>
        <div className={styles.taskInfo}>
          <div className={styles.taskName}>{task.name}</div>
          <div className={styles.taskDetail}>{task.detail}</div>
        </div>
        <div className={`${styles.taskPoints} ${styles.done}`}>⭐ +{task.points}</div>
        <div className={styles.taskDone}>✓ 已通过</div>
      </div>
    );
  }

  if (task.status === "pending") {
    return (
      <div className={styles.taskCard}>
        <div className={`${styles.taskIcon} ${styles[task.iconClass] ?? ""}`}>
          {task.icon}
        </div>
        <div className={styles.taskInfo}>
          <div className={styles.taskName}>{task.name}</div>
          <div className={styles.taskDetail}>{task.detail}</div>
        </div>
        <div className={styles.taskPoints}>⭐ +{task.points}</div>
        <div className={styles.taskPending}>🔍 等待审核</div>
      </div>
    );
  }

  return (
    <div className={styles.taskCard}>
      <div className={`${styles.taskIcon} ${styles[task.iconClass] ?? ""}`}>
        {task.icon}
      </div>
      <div className={styles.taskInfo}>
        <div className={styles.taskName}>{task.name}</div>
        <div className={styles.taskDetail}>{task.detail}</div>
      </div>
      <div className={styles.taskPoints}>⭐ +{task.points}</div>
      <button
        type="button"
        className={styles.taskSubmit}
        disabled={pending}
        onClick={() => {
          if (!onSubmit) return;
          startTransition(async () => {
            await onSubmit(task.id);
            toast.success("已提交,等待家长审核!");
          });
        }}
      >
        {pending ? "提交中…" : "✓ 完成"}
      </button>
    </div>
  );
}
